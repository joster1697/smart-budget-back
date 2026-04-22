/**
 * resolveAction — lógica compartida entre el HTTP REST controller y el WebSocket gateway.
 * Toma el resultado crudo de IngestionService y añade status + candidates.
 */
import {
  AgentParseResult,
  AgentIntent,
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

const CONFIDENCE_THRESHOLD = 0.5;

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
