/**
 * Ejecuta acciones READY directamente contra los services.
 * Usado por el WebSocket gateway donde no hay petición HTTP de por medio.
 */
import { AccountService } from './account.service';
import {
  AgentParseResult,
  CreateAccountPayload,
  CreateCategoryPayload,
  CreatePayload,
  ExecutableAction,
  QueryPayload,
  UpdateAccountPayload,
  UpdateCategoryPayload,
  UpdatePayload,
} from '../types/agent.types';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';

export type ExecutionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

// Acción enriquecida con el ID concreto que el usuario eligió/confirmó
export type { ExecutableAction } from '../types/agent.types';

export class ActionExecutorService {
  static async execute(action: ExecutableAction, userId: string): Promise<ExecutionResult> {
    try {
      switch (action.intent) {
        case 'CREATE_TRANSACTION': {
          const d = action.data as CreatePayload;
          const accountId = d.account_id ?? action.resolved_id;
          if (!accountId) {
            return { ok: false, message: 'No se pudo determinar la cuenta. Por favor indica a cuál cuenta registrar la transacción.' };
          }
          const account = await AccountService.getAccountById(accountId, userId);
          if (!account) {
            return { ok: false, message: 'La cuenta especificada no existe.' };
          }

          await TransactionService.createTransaction({
            user_id: userId,
            account_id: accountId,
            amount: d.amount,
            category_id: d.category_id ?? undefined,
            type: d.type,
            description: d.description,
          });

          // Calcular saldo resultante (ya fue actualizado por TransactionService)
          const updatedAccount = await AccountService.getAccountById(accountId, userId);
          const newBalance = Number(updatedAccount?.balance ?? 0);
          const sym = d.currency === 'CRC' ? '₡' : d.currency;
          const merchant = d.merchant ? ` en ${d.merchant}` : '';

          const isCredit = account.type === 'credit';
          const isNegative = newBalance < 0;
          let balanceNote = '';
          if (isCredit) {
            balanceNote = ` | Deuda en ${account.name}: ${sym}${Math.abs(newBalance).toLocaleString()}`;
          } else if (isNegative) {
            balanceNote = ` | ⚠️ ${account.name} quedó con saldo negativo: ${sym}${newBalance.toLocaleString()}`;
          } else {
            balanceNote = ` | Saldo en ${account.name}: ${sym}${newBalance.toLocaleString()}`;
          }

          return { ok: true, message: `✅ Transacción registrada: ${sym}${d.amount.toLocaleString()}${merchant} — ${d.date}${balanceNote}` };
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
          return ActionExecutorService.executeQuery(action.data as QueryPayload, userId);

        default:
          return { ok: false, message: 'Acción no reconocida.' };
      }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Error al ejecutar la acción.' };
    }
  }

  // ─── Query executor ─────────────────────────────────────────────────────────

  private static async executeQuery(payload: QueryPayload, userId: string): Promise<ExecutionResult> {
    const f = payload.filters ?? {};

    // Resolver account_name → account_id si no vino ya resuelto
    let resolvedAccountId = f.account_id;
    let resolvedAccount: Awaited<ReturnType<typeof AccountService.getAccountsByUserId>>[number] | undefined;
    if (!resolvedAccountId && f.account_name) {
      const accounts = await AccountService.getAccountsByUserId(userId);
      resolvedAccount = accounts.find((a) =>
        a.name.toLowerCase().includes(f.account_name!.toLowerCase()),
      );
      resolvedAccountId = resolvedAccount?.id;
    } else if (resolvedAccountId) {
      const all = await AccountService.getAccountsByUserId(userId);
      resolvedAccount = all.find((a) => a.id === resolvedAccountId);
    }

    // Resolver category_name → category_id si no vino ya resuelto
    let resolvedCategoryId = f.category_id;
    if (!resolvedCategoryId && f.category_name) {
      const categories = await CategoryService.getCategoriesByUserId(userId);
      const match = categories.find((c) =>
        (c.name ?? '').toLowerCase().includes(f.category_name!.toLowerCase()),
      );
      resolvedCategoryId = match?.id;
    }

    switch (payload.query_type) {
      case 'LIST_ACCOUNTS': {
        const accounts = await AccountService.getAccountsByUserId(userId);
        if (accounts.length === 0) return { ok: true, message: 'No tienes cuentas registradas aún.' };
        const typeLabel: Record<string, string> = {
          checking: 'Corriente', savings: 'Ahorros', credit: 'Crédito', cash: 'Efectivo', investment: 'Inversión',
        };
        const lines = accounts.map((a) => {
          const sym = '₡';
          const bal = Number(a.balance).toLocaleString('es-CR');
          const tipo = typeLabel[a.type] ?? a.type;
          return `• ${a.name} (${tipo}) — Saldo: ${sym}${bal}`;
        });
        return { ok: true, message: `🏦 Tus cuentas:\n${lines.join('\n')}` };
      }

      case 'LIST_CATEGORIES': {
        const categories = await CategoryService.getCategoriesByUserId(userId);
        if (categories.length === 0) return { ok: true, message: 'No tienes categorías registradas aún.' };
        const lines = categories.map((c) => `• ${c.name ?? '(sin nombre)'}`);
        return { ok: true, message: `🏷️ Tus categorías:\n${lines.join('\n')}` };
      }

      case 'ACCOUNT_BALANCE': {
        if (!resolvedAccountId || !resolvedAccount) {
          // Si no se resolvió, listar todas las cuentas con su saldo
          const accounts = await AccountService.getAccountsByUserId(userId);
          if (accounts.length === 0) return { ok: true, message: 'No tienes cuentas registradas.' };
          const lines = accounts.map((a) => `• ${a.name}: ₡${Number(a.balance).toLocaleString('es-CR')}`);
          return { ok: true, message: `💰 Saldos de tus cuentas:\n${lines.join('\n')}` };
        }
        const sym = '₡';
        const bal = Number(resolvedAccount.balance).toLocaleString('es-CR');
        const isCredit = resolvedAccount.type === 'credit';
        const label = isCredit ? `Deuda en ${resolvedAccount.name}` : `Saldo en ${resolvedAccount.name}`;
        return { ok: true, message: `💰 ${label}: ${sym}${bal}` };
      }

      case 'ACCOUNT_STATEMENT': {
        if (!resolvedAccountId || !resolvedAccount) {
          return { ok: false, message: `No encontré una cuenta con el nombre "${f.account_name ?? '(no especificado)'}". Verifica el nombre e inténtalo de nuevo.` };
        }
        const txs = await TransactionService.queryWithFilters(userId, {
          account_id: resolvedAccountId,
          date_from: f.date_from,
          date_to: f.date_to,
          limit: 10,
        });
        const sym = '₡';
        const bal = Number(resolvedAccount.balance).toLocaleString('es-CR');
        const typeLabel: Record<string, string> = {
          checking: 'Corriente', savings: 'Ahorros', credit: 'Crédito', cash: 'Efectivo', investment: 'Inversión',
        };
        let msg = `📄 Estado de cuenta: ${resolvedAccount.name}\nTipo: ${typeLabel[resolvedAccount.type] ?? resolvedAccount.type} | Saldo actual: ${sym}${bal}\n`;
        if (txs.length === 0) {
          msg += '\nSin transacciones registradas.';
        } else {
          msg += `\nÚltimas ${txs.length} transacciones:\n`;
          msg += txs.map((t) => ActionExecutorService.formatTransaction(t)).join('\n');
        }
        return { ok: true, message: msg };
      }

      case 'LIST_TRANSACTIONS': {
        const txs = await TransactionService.queryWithFilters(userId, {
          account_id: resolvedAccountId,
          category_id: resolvedCategoryId,
          date_from: f.date_from,
          date_to: f.date_to,
          type: f.transaction_type,
          limit: f.limit ?? 20,
        });
        if (txs.length === 0) return { ok: true, message: 'No encontré transacciones con esos criterios.' };
        const header = ActionExecutorService.buildRangeHeader(f.date_from, f.date_to);
        return { ok: true, message: `📋 Transacciones${header}:\n${txs.map((t) => ActionExecutorService.formatTransaction(t)).join('\n')}` };
      }

      case 'SPENDING_SUMMARY': {
        const txs = await TransactionService.queryWithFilters(userId, {
          account_id: resolvedAccountId,
          category_id: resolvedCategoryId,
          date_from: f.date_from,
          date_to: f.date_to,
          type: f.transaction_type,
          limit: 1000,
        });
        if (txs.length === 0) return { ok: true, message: 'No encontré transacciones para ese período.' };
        const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount ?? 0), 0);
        const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount ?? 0), 0);
        const net = totalIncome - totalExpenses;
        const sym = '₡';
        const header = ActionExecutorService.buildRangeHeader(f.date_from, f.date_to);
        let msg = `📊 Resumen financiero${header}:\n`;
        msg += `• Gastos:   ${sym}${totalExpenses.toLocaleString('es-CR')}\n`;
        msg += `• Ingresos: ${sym}${totalIncome.toLocaleString('es-CR')}\n`;
        msg += `• Balance neto: ${net >= 0 ? '+' : ''}${sym}${net.toLocaleString('es-CR')}`;
        return { ok: true, message: msg };
      }

      default:
        return { ok: false, message: 'Tipo de consulta no reconocida.' };
    }
  }

  private static formatTransaction(t: {
    date?: Date | null;
    type?: string | null;
    amount?: number | null;
    merchant?: string | null;
    description?: string | null;
    account?: { name?: string } | null;
    category?: { name?: string } | null;
  }): string {
    const date = t.date ? new Date(t.date).toLocaleDateString('es-CR') : '—';
    const sign = t.type === 'income' ? '+' : '-';
    const amt = `${sign}₡${Number(t.amount ?? 0).toLocaleString('es-CR')}`;
    const label = t.merchant || t.description || '—';
    const account = t.account?.name ? ` [${t.account.name}]` : '';
    const category = t.category?.name ? ` (${t.category.name})` : '';
    return `• ${date}  ${amt}  ${label}${account}${category}`;
  }

  private static buildRangeHeader(dateFrom?: string, dateTo?: string): string {
    if (!dateFrom && !dateTo) return '';
    if (dateFrom && dateTo && dateFrom === dateTo) return ` del ${dateFrom}`;
    if (dateFrom && dateTo) return ` del ${dateFrom} al ${dateTo}`;
    if (dateFrom) return ` desde ${dateFrom}`;
    return ` hasta ${dateTo}`;
  }
}
