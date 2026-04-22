/**
 * agent.gateway.ts — WebSocket gateway para la conversación usuario ↔ agente.
 *
 * Protocolo (cliente → servidor):
 *   { type: 'MESSAGE',  payload: { text: string } }
 *   { type: 'CONFIRM',  payload: { actionIndex: number } }                   — confirma DELETE de una acción
 *   { type: 'SELECT',   payload: { actionIndex: number; candidateIndex: number } } — resuelve AMBIGUOUS
 *   { type: 'CANCEL' }                                                        — descarta acciones pendientes
 *   { type: 'CLARIFY',  payload: { actionIndex: number; text: string } }      — respuesta a NEEDS_CLARIFICATION
 *
 * Protocolo (servidor → cliente):
 *   { type: 'THINKING' }
 *   { type: 'ACTIONS',  payload: ResolvedAction[] }
 *   { type: 'RESULT',   payload: { actionIndex: number; message: string } }
 *   { type: 'ERROR',    payload: { message: string } }
 *   { type: 'INFO',     payload: { message: string } }
 *
 * Auth: primer query-param ?token=<JWT> al hacer la conexión WS.
 */
import { IncomingMessage, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';
import { IngestionService } from '../services/ai/ingestion.service';
import { resolveActions, ResolvedAction } from '../services/channel-processor';
import { ActionExecutorService } from '../services/action-executor.service';

// ──────────────────────────────────────────────────────────────────────────────
// Socket state
// ──────────────────────────────────────────────────────────────────────────────
interface AgentSocket extends WebSocket {
  userId?: string;
  pendingActions?: ResolvedAction[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function send(ws: WebSocket, obj: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function sendError(ws: WebSocket, message: string) {
  send(ws, { type: 'ERROR', payload: { message } });
}

function sendInfo(ws: WebSocket, message: string) {
  send(ws, { type: 'INFO', payload: { message } });
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────────────────
function authenticateConnection(req: IncomingMessage): string | null {
  try {
    const parsed = url.parse(req.url ?? '', true);
    const token = parsed.query.token;
    if (typeof token !== 'string' || !token) return null;
    const payload = AuthService.verifyAccessToken(token);
    return payload.userId;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────────────────────
async function handleMessage(ws: AgentSocket, raw: string) {
  let msg: { type: string; payload?: unknown };
  try {
    msg = JSON.parse(raw);
  } catch {
    sendError(ws, 'Mensaje inválido: se esperaba JSON.');
    return;
  }

  const userId = ws.userId!;

  switch (msg.type) {

    // ── Nuevo input de texto ──────────────────────────────────────────────────
    case 'MESSAGE': {
      const p = msg.payload as { text?: string };
      if (!p?.text?.trim()) { sendError(ws, 'El campo "text" es requerido.'); return; }

      send(ws, { type: 'THINKING' });
      try {
        const categories = await CategoryService.getCategoriesByUserId(userId);
        const categoryContext = categories.map((c) => ({ id: c.id, name: c.name ?? '' }));
        const raw = await IngestionService.parseFromText(p.text.trim(), categoryContext, 'text');
        const actions = await resolveActions(userId, raw);

        ws.pendingActions = actions;
        send(ws, { type: 'ACTIONS', payload: actions });

        // Ejecutar automáticamente las acciones READY
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          if (action.status === 'READY') {
            const result = await ActionExecutorService.execute(
              { ...action, resolved_id: extractId(action.candidates) },
              userId,
            );
            send(ws, { type: 'RESULT', payload: { actionIndex: i, message: result.message } });
          }
        }
      } catch (err) {
        sendError(ws, err instanceof Error ? err.message : 'Error al procesar el mensaje.');
      }
      break;
    }

    // ── Confirmar acción DELETE (NEEDS_CONFIRMATION) ──────────────────────────
    case 'CONFIRM': {
      const p = msg.payload as { actionIndex?: number };
      const action = getPendingAction(ws, p?.actionIndex);
      if (!action) { sendError(ws, 'Índice de acción inválido.'); return; }
      if (action.status !== 'NEEDS_CONFIRMATION') { sendError(ws, 'Esta acción no requiere confirmación.'); return; }

      const id = extractId(action.candidates);
      const result = await ActionExecutorService.execute({ ...action, resolved_id: id }, userId);
      send(ws, { type: 'RESULT', payload: { actionIndex: p.actionIndex, message: result.message } });
      break;
    }

    // ── Resolver AMBIGUOUS eligiendo candidato ────────────────────────────────
    case 'SELECT': {
      const p = msg.payload as { actionIndex?: number; candidateIndex?: number };
      const action = getPendingAction(ws, p?.actionIndex);
      if (!action) { sendError(ws, 'Índice de acción inválido.'); return; }
      if (action.status !== 'AMBIGUOUS') { sendError(ws, 'Esta acción no es ambigua.'); return; }

      const candidate = (action.candidates ?? [])[p?.candidateIndex ?? -1] as { id?: string } | undefined;
      if (!candidate?.id) { sendError(ws, 'Candidato no encontrado.'); return; }

      // DELETE ambigüe → confirmar primero; UPDATE → ejecutar directo
      if (action.intent.startsWith('DELETE_')) {
        // Pedir confirmación
        action.status = 'NEEDS_CONFIRMATION';
        action.candidates = [candidate];
        send(ws, { type: 'ACTIONS', payload: ws.pendingActions });
        sendInfo(ws, `¿Confirmas que quieres eliminar "${(candidate as { name?: string }).name ?? candidate.id}"?`);
      } else {
        const result = await ActionExecutorService.execute({ ...action, resolved_id: candidate.id }, userId);
        send(ws, { type: 'RESULT', payload: { actionIndex: p.actionIndex, message: result.message } });
      }
      break;
    }

    // ── Cancelar acciones pendientes ──────────────────────────────────────────
    case 'CANCEL': {
      ws.pendingActions = undefined;
      sendInfo(ws, 'Acciones canceladas.');
      break;
    }

    // ── Respuesta a NEEDS_CLARIFICATION (re-procesa con contexto extra) ───────
    case 'CLARIFY': {
      const p = msg.payload as { actionIndex?: number; text?: string };
      if (!p?.text?.trim()) { sendError(ws, 'El campo "text" es requerido.'); return; }

      send(ws, { type: 'THINKING' });
      try {
        const categories = await CategoryService.getCategoriesByUserId(userId);
        const categoryContext = categories.map((c) => ({ id: c.id, name: c.name ?? '' }));
        const raw = await IngestionService.parseFromText(p.text.trim(), categoryContext, 'text');
        const actions = await resolveActions(userId, raw);

        // Reemplazar sólo la acción aclarada si el índice es válido
        if (
          typeof p.actionIndex === 'number' &&
          ws.pendingActions &&
          ws.pendingActions[p.actionIndex]
        ) {
          ws.pendingActions[p.actionIndex] = actions[0] ?? ws.pendingActions[p.actionIndex];
        } else {
          ws.pendingActions = actions;
        }

        send(ws, { type: 'ACTIONS', payload: ws.pendingActions });

        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          if (action.status === 'READY') {
            const result = await ActionExecutorService.execute(
              { ...action, resolved_id: extractId(action.candidates) },
              userId,
            );
            send(ws, { type: 'RESULT', payload: { actionIndex: i, message: result.message } });
          }
        }
      } catch (err) {
        sendError(ws, err instanceof Error ? err.message : 'Error al procesar la aclaración.');
      }
      break;
    }

    default:
      sendError(ws, `Tipo de mensaje desconocido: "${msg.type}"`);
  }
}

function getPendingAction(ws: AgentSocket, index: number | undefined): ResolvedAction | undefined {
  if (!ws.pendingActions || typeof index !== 'number') return undefined;
  return ws.pendingActions[index];
}

export function extractId(candidates: unknown[] | undefined): string | undefined {
  const first = candidates?.[0];
  if (!first || typeof first !== 'object') return undefined;
  return (first as { id?: string }).id;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────────────────────
export function createAgentGateway(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/agent/chat' });

  wss.on('connection', (ws: AgentSocket, req: IncomingMessage) => {
    const userId = authenticateConnection(req);
    if (!userId) {
      ws.close(4001, 'Unauthorized');
      return;
    }
    ws.userId = userId;
    sendInfo(ws, '¡Hola! Soy tu asistente financiero Fynkro. ¿En qué puedo ayudarte?');

    ws.on('message', (data) => {
      handleMessage(ws, data.toString()).catch((err) => {
        console.error('[AgentGateway] Unhandled error:', err);
        sendError(ws, 'Error interno del servidor.');
      });
    });

    ws.on('error', (err) => console.error('[AgentGateway] Socket error:', err));
  });

  console.log('🔌 Agent WebSocket gateway montado en /agent/chat');
  return wss;
}
