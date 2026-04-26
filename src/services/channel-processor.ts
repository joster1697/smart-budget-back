/**
 * resolveAction — lógica compartida entre el HTTP REST controller y el WebSocket gateway.
 * Toma el resultado crudo de IngestionService y añade status + candidates.
 */
import {
  AgentParseResult,
  AgentIntent,
  CreatePayload,
  UpdatePayload,
  DeletePayload,
  UpdateAccountPayload,
  DeleteAccountPayload,
  UpdateCategoryPayload,
  DeleteCategoryPayload,
} from './ai/ingestion.service';
import { TransactionService } from './transaction.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';

export type ActionStatus = 'READY' | 'NEEDS_CONFIRMATION' | 'AMBIGUOUS' | 'NEEDS_CLARIFICATION';

export type ResolvedAction = AgentParseResult & {
  status: ActionStatus;
  candidates?: unknown[];
  follow_up_question?: string;
};

const CONFIDENCE_THRESHOLD = 0.8; // Umbral de confianza para decidir si se necesita clarificación

export async function resolveActions(
  userId: string,
  results: AgentParseResult[],
): Promise<ResolvedAction[]> {
  return Promise.all(results.map((r) => resolveAction(userId, r)));
}

async function resolveAction(userId: string, result: AgentParseResult): Promise<ResolvedAction> {
  const confidence = ((result.data as { confidence?: number }).confidence ?? 1);

  if (confidence < CONFIDENCE_THRESHOLD) {
    return { ...result, status: 'NEEDS_CLARIFICATION', follow_up_question: '¿Puedes darme más detalles? No entendí bien la solicitud.' };
  }

  if (result.intent === 'CREATE_TRANSACTION') {
    const payload = result.data as CreatePayload;
    if (!payload.account_id) {
      const accounts = await AccountService.getAccountsByUserId(userId);
      if (accounts.length === 0) {
        return { ...result, status: 'NEEDS_CLARIFICATION', follow_up_question: 'No tienes ninguna cuenta registrada. Primero crea una cuenta.' };
      }
      if (accounts.length === 1) {
        // Auto-seleccionar la única cuenta disponible
        const data = { ...payload, account_id: accounts[0].id, account_name: accounts[0].name };
        return { ...result, data, status: 'READY', candidates: accounts };
      }
      return { ...result, status: 'AMBIGUOUS', candidates: accounts, follow_up_question: '¿A cuál cuenta quieres registrar esta transacción?' };
    }
    return { ...result, status: 'READY' };
  }

  if (result.intent === 'UPDATE_TRANSACTION' || result.intent === 'DELETE_TRANSACTION') {
    const payload = result.data as UpdatePayload | DeletePayload;
    const candidates = await TransactionService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna transacción con esos criterios. ¿Puedes describirla mejor?' };
    const verb = result.intent === 'DELETE_TRANSACTION' ? 'eliminar' : 'modificar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} transacciones. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_TRANSACTION') return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: '¿Confirmas que quieres eliminar esta transacción?' };
    return { ...result, status: 'READY', candidates };
  }

  if (result.intent === 'UPDATE_ACCOUNT' || result.intent === 'DELETE_ACCOUNT') {
    const payload = result.data as UpdateAccountPayload | DeleteAccountPayload;
    const candidates = await AccountService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna cuenta con ese nombre. ¿Puedes especificar mejor?' };
    const verb = result.intent === 'DELETE_ACCOUNT' ? 'eliminar' : 'modificar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} cuentas. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_ACCOUNT') return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: '¿Confirmas que quieres eliminar esta cuenta?' };
    return { ...result, status: 'READY', candidates };
  }

  if (result.intent === 'UPDATE_CATEGORY' || result.intent === 'DELETE_CATEGORY') {
    const payload = result.data as UpdateCategoryPayload | DeleteCategoryPayload;
    const candidates = await CategoryService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna categoría con ese nombre. ¿Puedes verificar el nombre?' };
    const verb = result.intent === 'DELETE_CATEGORY' ? 'eliminar' : 'renombrar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} categorías. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_CATEGORY') return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: '¿Confirmas que quieres eliminar esta categoría?' };
    return { ...result, status: 'READY', candidates };
  }

  return { ...result, status: 'READY' };
}

// Re-exportar AgentIntent para que los consumidores no tengan que importar de dos sitios
export type { AgentIntent };
