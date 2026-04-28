/**
 * resolveAction — lógica compartida entre el HTTP REST controller y el WebSocket gateway.
 * Toma el resultado crudo de IngestionService y añade status + candidates.
 */
import {
  AgentParseResult,
  AgentIntent,
  ActionStatus,
  ResolvedAction,
  CreatePayload,
  UpdatePayload,
  DeletePayload,
  UpdateAccountPayload,
  DeleteAccountPayload,
  UpdateCategoryPayload,
  DeleteCategoryPayload,
} from '../types/agent.types';
import { TransactionService } from './transaction.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { IngestionService, AccountContext } from './ai/ingestion.service';
import { Transaction } from '../database/models/transaction';
import { Account } from '../database/models/account';
import { Category } from '../database/models/category';

export type { ActionStatus, ResolvedAction };

export async function processInput(
  userId: string,
  input: string,
  parsedFrom: 'text' | 'audio',
): Promise<ResolvedAction[]> {
  const [categories, accounts] = await Promise.all([
    CategoryService.getCategoriesByUserId(userId),
    AccountService.getAccountsByUserId(userId),
  ]);
  const categoryContext = categories.map((c) => ({ id: c.id, name: c.name ?? '' }));
  const accountContext: AccountContext[] = accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }));
  const raw = await IngestionService.parseFromText(input, categoryContext, accountContext, parsedFrom);
  return resolveActions(userId, raw);
}

const CONFIDENCE_THRESHOLD = 0.8; // Umbral de confianza para decidir si se necesita clarificación

// ─── Helpers de formato para confirmaciones ──────────────────────────────────

function formatTransactionSummary(t: Transaction): string {
  const amount = Number(t.amount ?? 0).toLocaleString('es-CR');
  const type = t.type === 'income' ? '📥 Ingreso' : '📤 Gasto';
  const date = t.date ? new Date(t.date).toLocaleDateString('es-CR') : '—';
  const desc = t.description ?? t.merchant ?? '(sin descripción)';
  return `${type} de ₡${amount} — ${desc} (${date})`;
}

function formatAccountSummary(a: Account): string {
  const typeLabel: Record<string, string> = {
    checking: 'Corriente', savings: 'Ahorros', credit: 'Crédito', cash: 'Efectivo', investment: 'Inversión',
  };
  const balance = Number(a.balance ?? 0).toLocaleString('es-CR');
  const tipo = typeLabel[a.type] ?? a.type;
  return `🏦 ${a.name} (${tipo}) — Saldo: ₡${balance}`;
}

function formatCategorySummary(c: Category): string {
  return `🏷️ ${c.name ?? '(sin nombre)'}`;
}

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
    let payload = result.data as CreatePayload;

    // 1. Resolver cuenta
    if (!payload.account_id) {
      const accounts = await AccountService.getAccountsByUserId(userId);
      if (accounts.length === 0) {
        return { ...result, status: 'NEEDS_CLARIFICATION', follow_up_question: 'No tienes ninguna cuenta registrada. Primero crea una cuenta.' };
      }
      if (accounts.length === 1) {
        payload = { ...payload, account_id: accounts[0].id, account_name: accounts[0].name };
      } else {
        return { ...result, data: payload, status: 'AMBIGUOUS', candidates: accounts, follow_up_question: '¿A cuál cuenta quieres registrar esta transacción?' };
      }
    }

    // 2. Resolver categoría
    if (!payload.category_id) {
      const categories = await CategoryService.getCategoriesByUserId(userId);
      if (categories.length > 0) {
        const match = categories.find(
          (c) => (c.name ?? '').toLowerCase() === (payload.category_name ?? '').toLowerCase()
        );
        if (match) {
          payload = { ...payload, category_id: match.id };
        } else {
          const list = categories.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
          const searched = payload.category_name ? ` "${payload.category_name}"` : '';
          return {
            ...result,
            data: payload,
            status: 'AMBIGUOUS',
            candidates: categories,
            follow_up_question: `No encontré una categoría para esta transacción.${searched}. ¿A cuál quieres asignar esta transacción?`,
          };
        }
      }
    }

    return { ...result, data: payload, status: 'READY' };
  }

  if (result.intent === 'UPDATE_TRANSACTION' || result.intent === 'DELETE_TRANSACTION') {
    const payload = result.data as UpdatePayload | DeletePayload;
    const candidates = await TransactionService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna transacción con esos criterios. ¿Puedes describirla mejor?' };
    const verb = result.intent === 'DELETE_TRANSACTION' ? 'eliminar' : 'modificar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} transacciones. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_TRANSACTION') {
      const summary = formatTransactionSummary(candidates[0] as Transaction);
      return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: `¿Confirmas que quieres eliminar esta transacción?\n\n${summary}` };
    }
    return { ...result, status: 'READY', candidates };
  }

  if (result.intent === 'UPDATE_ACCOUNT' || result.intent === 'DELETE_ACCOUNT') {
    const payload = result.data as UpdateAccountPayload | DeleteAccountPayload;
    const candidates = await AccountService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna cuenta con ese nombre. ¿Puedes especificar mejor?' };
    const verb = result.intent === 'DELETE_ACCOUNT' ? 'eliminar' : 'modificar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} cuentas. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_ACCOUNT') {
      const summary = formatAccountSummary(candidates[0] as Account);
      return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: `¿Confirmas que quieres eliminar esta cuenta?\n\n${summary}` };
    }
    return { ...result, status: 'READY', candidates };
  }

  if (result.intent === 'UPDATE_CATEGORY' || result.intent === 'DELETE_CATEGORY') {
    const payload = result.data as UpdateCategoryPayload | DeleteCategoryPayload;
    const candidates = await CategoryService.searchByContext(userId, payload.search);
    if (candidates.length === 0) return { ...result, status: 'NEEDS_CLARIFICATION', candidates: [], follow_up_question: 'No encontré ninguna categoría con ese nombre. ¿Puedes verificar el nombre?' };
    const verb = result.intent === 'DELETE_CATEGORY' ? 'eliminar' : 'renombrar';
    if (candidates.length > 1) return { ...result, status: 'AMBIGUOUS', candidates, follow_up_question: `Encontré ${candidates.length} categorías. ¿Cuál quieres ${verb}?` };
    if (result.intent === 'DELETE_CATEGORY') {
      const summary = formatCategorySummary(candidates[0] as Category);
      return { ...result, status: 'NEEDS_CONFIRMATION', candidates, follow_up_question: `¿Confirmas que quieres eliminar esta categoría?\n\n${summary}` };
    }
    return { ...result, status: 'READY', candidates };
  }

  return { ...result, status: 'READY' };
}

// Re-exportar AgentIntent para que los consumidores no tengan que importar de dos sitios
export type { AgentIntent };
