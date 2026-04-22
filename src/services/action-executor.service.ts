/**
 * Ejecuta acciones READY directamente contra los services.
 * Usado por el WebSocket gateway donde no hay petición HTTP de por medio.
 */
import {
  AgentParseResult,
  CreatePayload,
  CreateAccountPayload,
  CreateCategoryPayload,
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

export type ExecutionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

// Acción enriquecida con el ID concreto que el usuario eligió/confirmó
export type ResolvedAction = AgentParseResult & { resolved_id?: string };

export class ActionExecutorService {
  static async execute(action: ResolvedAction, userId: string): Promise<ExecutionResult> {
    try {
      switch (action.intent) {
        case 'CREATE_TRANSACTION': {
          const d = action.data as CreatePayload;
          const accounts = await AccountService.getAccountsByUserId(userId);
          if (accounts.length === 0) {
            return { ok: false, message: 'No tienes ninguna cuenta registrada. Crea una cuenta primero.' };
          }
          await TransactionService.createTransaction({
            user_id: userId,
            account_id: accounts[0].id,
            amount: d.amount,
            category_id: d.category_id ?? undefined,
            type: d.amount >= 0 ? 'expense' : 'income',
            description: d.description,
          });
          const sym = d.currency === 'CRC' ? '₡' : d.currency;
          const merchant = d.merchant ? ` en ${d.merchant}` : '';
          return { ok: true, message: `✅ Transacción registrada: ${sym}${d.amount.toLocaleString()}${merchant} — ${d.date}` };
        }

        case 'CREATE_ACCOUNT': {
          const d = action.data as CreateAccountPayload;
          await AccountService.createAccount({ user_id: userId, name: d.name, type: d.type, balance: d.balance });
          const sym = d.currency === 'CRC' ? '₡' : d.currency;
          return { ok: true, message: `✅ Cuenta "${d.name}" creada con saldo ${sym}${d.balance.toLocaleString()}` };
        }

        case 'CREATE_CATEGORY': {
          const d = action.data as CreateCategoryPayload;
          await CategoryService.createCategory({ name: d.name, user_id: userId });
          return { ok: true, message: `✅ Categoría "${d.name}" creada` };
        }

        case 'UPDATE_TRANSACTION': {
          const d = action.data as UpdatePayload;
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué transacción actualizar.' };
          const changes = { ...d.changes, date: d.changes.date ? new Date(d.changes.date) : undefined };
          await TransactionService.updateTransaction(action.resolved_id, userId, changes);
          return { ok: true, message: '✅ Transacción actualizada.' };
        }

        case 'DELETE_TRANSACTION': {
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué transacción eliminar.' };
          await TransactionService.deleteTransaction(action.resolved_id, userId);
          return { ok: true, message: '✅ Transacción eliminada.' };
        }

        case 'UPDATE_ACCOUNT': {
          const d = action.data as UpdateAccountPayload;
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué cuenta actualizar.' };
          await AccountService.updateAccount(action.resolved_id, userId, d.changes);
          return { ok: true, message: '✅ Cuenta actualizada.' };
        }

        case 'DELETE_ACCOUNT': {
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué cuenta eliminar.' };
          await AccountService.deleteAccount(action.resolved_id, userId);
          return { ok: true, message: '✅ Cuenta eliminada.' };
        }

        case 'UPDATE_CATEGORY': {
          const d = action.data as UpdateCategoryPayload;
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué categoría actualizar.' };
          await CategoryService.updateCategory(action.resolved_id, userId, { name: d.changes.name, user_id: userId });
          return { ok: true, message: `✅ Categoría renombrada a "${d.changes.name}".` };
        }

        case 'DELETE_CATEGORY': {
          if (!action.resolved_id) return { ok: false, message: 'No se especificó qué categoría eliminar.' };
          await CategoryService.deleteCategory(action.resolved_id, userId);
          return { ok: true, message: '✅ Categoría eliminada.' };
        }

        case 'QUERY':
          return { ok: false, message: 'Las consultas de análisis aún no están implementadas.' };

        default:
          return { ok: false, message: 'Acción no reconocida.' };
      }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Error al ejecutar la acción.' };
    }
  }
}
