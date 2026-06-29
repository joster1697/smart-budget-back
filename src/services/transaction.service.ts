// services/transaction.service.ts
import { Op } from "sequelize";
import { Account } from "../database/models";
import { Category } from "../database/models";
import {
  Transaction,
  TransactionCreationAttributes,
} from "../database/models/transaction";
import { User } from "../database/models/user";
import { Debt } from "../database/models/debt";
import { DebtPaymentProcessor } from "./debt-payment-processor.service";
import { TransactionSearchCriteria } from "./ai/ingestion.service";
import { ExchangeRateService } from "./exchange-rate.service";
import { SavingsGoalProcessor } from "./savings-goal-processor.service";

export interface ITransactionFilters {
  date_from?: string;
  date_to?: string;
  account_id?: string;
  category_id?: string;
  type?: string;
  limit?: number;
}

export interface IRestTransactionFilters {
  account_id?: string;
  category_id?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// Interface para creación de transacciones
export interface ITransactionCreate {
  user_id: string;
  account_id: string;
  amount: number;
  original_currency?: string;
  original_amount?: number;
  exchange_rate?: number;
  category_id?: string;
  type: string;
  description: string;
  date?: string | Date;
  merchant?: string;
  notes?: string;
}

// Interface para actualización de transacciones
export interface ITransactionUpdate {
  account_id?: string;
  amount?: number;
  category_id?: string;
  type?: string;
  description?: string;
  date?: Date;
}

export class TransactionService {
  /**
   * Obtener todas las transacciones de un usuario
   */
  static async getTransactionsByUserId(
    userId: string,
    filters?: IRestTransactionFilters,
  ) {
    const where: any = { user_id: userId };

    if (filters) {
      if (filters.account_id) where.account_id = filters.account_id;
      if (filters.category_id) where.category_id = filters.category_id;
      if (filters.type) where.type = filters.type;

      if (filters.from || filters.to) {
        const fromDate = filters.from ? new Date(filters.from) : new Date(0);
        const toDate = filters.to
          ? new Date(`${filters.to}T23:59:59.999`)
          : new Date();
        where.date = { [Op.between]: [fromDate, toDate] };
      }
    }

    return await Transaction.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
        {
          model: Account,
          attributes: ["id", "name"],
        },
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
      limit: filters?.limit,
    });
  }

  /**
   * Obtener una transacción por ID
   */
  static async getTransactionById(transactionId: string, userId: string) {
    return await Transaction.findOne({
      where: {
        id: transactionId,
        user_id: userId, // Asegurarse que el usuario solo acceda a sus propias transacciones
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });
  }

  /**
   * Crear una nueva transacción
   */
  static async createTransaction(transactionData: ITransactionCreate) {
    // Verificar que el usuario existe
    const user = await User.findByPk(transactionData.user_id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    //Conversion de Divisas
    const baseCurrency = user.base_currency || "CRC";
    const originalCurrency = transactionData.original_currency || baseCurrency;

    //Si el gasto viene en una moeda distinta a la cuenta del usuario
    if (originalCurrency !== baseCurrency) {
      console.log(
        `Convirtiendo gasto de ${originalCurrency} a ${baseCurrency}...`,
      );
      //Llamamos al servicio para obtener tipo de cambio
      const rate = await ExchangeRateService.getrate(
        originalCurrency,
        baseCurrency,
      );
      //Se guardan los valores originales para que no se pierdan
      transactionData.original_amount = transactionData.amount;
      transactionData.exchange_rate = rate;
      transactionData.original_currency = originalCurrency;
      //Se calcula el monto  de la moneda local del usuario
      transactionData.amount = Number(
        (transactionData.amount * rate).toFixed(2),
      );
    }

    // Si hay una cuenta vinculada, verificar que existe y pertenece al usuario
    let linkedAccount = null;
    if (transactionData.account_id) {
      linkedAccount = await Account.findOne({
        where: {
          id: transactionData.account_id,
          user_id: transactionData.user_id,
        },
      });
      if (!linkedAccount) {
        throw new Error(
          "La cuenta vinculada no existe o no pertenece al usuario",
        );
      }
    }

    // Crear la transacción
    const transactionToCreate: TransactionCreationAttributes = {
      user_id: transactionData.user_id,
      account_id: transactionData.account_id,
      amount: transactionData.amount,
      original_currency: transactionData.original_currency, // Se agrego para que IA o web accesen,se hace la conversion y se agrega de manera automatica
      original_amount: transactionData.original_amount, // Se agrego para que IA o web accesen,se hace la conversion y se agrega de manera automatica
      exchange_rate: transactionData.exchange_rate, // Se agrego para que IA o web accesen,se hace la conversion y se agrega de manera automatica
      category_id: transactionData.category_id,
      type: transactionData.type,
      description: transactionData.description,
      date: transactionData.date ? new Date(transactionData.date) : new Date(),
      merchant: transactionData.merchant,
      // notes: transactionData.notes,
    };

    // Asociar meta de ahorro si corresponde
    if (transactionToCreate.category_id) {
      const associatedGoal = await SavingsGoalProcessor.findAssociatedGoal(
        transactionToCreate.category_id,
        transactionToCreate.user_id
      );
      if (associatedGoal) {
        transactionToCreate.savings_goal_id = associatedGoal.id;
      }
    }

    const created = await Transaction.create(transactionToCreate);

    // Actualizar el saldo de la cuenta
    if (linkedAccount) {
      const delta =
        transactionData.type === "income"
          ? transactionData.amount
          : -transactionData.amount;

      //Actualiza el balance real de la tarjeta
      await linkedAccount.increment("balance", { by: delta });

      // Logica de Saldo Reservado(Escudo de Saldo)
      // Si esta tarjeta esta vinculada a otra cuenta(ej:debito)
      if (linkedAccount.account_linked) {
        const debitAccount = await Account.findByPk(
          linkedAccount.account_linked,
        );
        if (debitAccount) {
          if (transactionData.type === "expense") {
            //Si gastamos,la deuda crece -> Aumenta el saldo reservado en el debito
            await debitAccount.increment("reserved_balance", {
              by: transactionData.amount,
            });
          } else if (transactionData.type === "income") {
            await debitAccount.decrement("reserved_balance", {
              by: transactionData.amount,
            });
          }
        }
      }
    }

    // Hook to update debt balance if category is associated with a debt
    if (transactionToCreate.category_id) {
      const debt = await Debt.findOne({ where: { category_id: transactionToCreate.category_id } });
      if (debt) {
        if (transactionToCreate.type === "expense") {
          await DebtPaymentProcessor.processPayment(debt.id, transactionToCreate.amount);
        } else if (transactionToCreate.type === "income") {
          await DebtPaymentProcessor.revertPayment(debt.id, transactionToCreate.amount);
        }
      }
    }

    // Hook to update savings goal if category is associated with a savings goal
    if (created.savings_goal_id) {
      await SavingsGoalProcessor.processPayment(
        created.savings_goal_id,
        Number(created.amount || 0),
        created.type || "expense"
      );
    }

    return created;
  }

  /**
   * Actualizar una transacción existente
   */
  static async updateTransaction(
    transactionId: string,
    userId: string,
    updateData: ITransactionUpdate,
  ) {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, user_id: userId },
    });

    if (!transaction) {
      return null;
    }

    // Si se cambia la cuenta, verificar que existe y pertenece al usuario
    if (updateData.account_id) {
      const account = await Account.findOne({
        where: { id: updateData.account_id, user_id: userId },
      });
      if (!account) {
        throw new Error("La cuenta no existe o no pertenece al usuario");
      }
    }

    const oldAccountId = transaction.account_id;
    const oldAmount = Number(transaction.amount ?? 0);
    const oldType = transaction.type ?? "expense";
    const oldCategoryId = transaction.category_id;
    const oldSavingsGoalId = transaction.savings_goal_id;

    await transaction.update(updateData);

    const hasAccountIdChanged = updateData.account_id !== undefined && updateData.account_id !== oldAccountId;
    const hasAmountChanged = updateData.amount !== undefined && Number(updateData.amount) !== oldAmount;
    const hasTypeChanged = updateData.type !== undefined && updateData.type !== oldType;
    const hasCategoryChanged = updateData.category_id !== undefined && updateData.category_id !== oldCategoryId;

    if (hasAccountIdChanged || hasAmountChanged || hasTypeChanged) {
      // 1. Revertir el saldo e impacto en la cuenta vieja
      if (oldAccountId) {
        const oldAccount = await Account.findByPk(oldAccountId);
        if (oldAccount) {
          const revertDelta = oldType === "income" ? -oldAmount : oldAmount;
          await oldAccount.increment("balance", { by: revertDelta });

          // Revertir el saldo reservado en la cuenta vinculada vieja
          if (oldAccount.account_linked) {
            const debitAccount = await Account.findByPk(oldAccount.account_linked);
            if (debitAccount) {
              if (oldType === "expense") {
                await debitAccount.decrement("reserved_balance", { by: oldAmount });
              } else if (oldType === "income") {
                await debitAccount.increment("reserved_balance", { by: oldAmount });
              }
            }
          }
        }
      }

      // 2. Aplicar el saldo e impacto a la cuenta nueva
      const newAccountId = updateData.account_id ?? oldAccountId;
      const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldAmount;
      const newType = updateData.type ?? oldType;

      if (newAccountId) {
        const newAccount = await Account.findByPk(newAccountId);
        if (newAccount) {
          const applyDelta = newType === "income" ? newAmount : -newAmount;
          await newAccount.increment("balance", { by: applyDelta });

          // Aplicar el saldo reservado en la cuenta vinculada nueva
          if (newAccount.account_linked) {
            const debitAccount = await Account.findByPk(newAccount.account_linked);
            if (debitAccount) {
              if (newType === "expense") {
                await debitAccount.increment("reserved_balance", { by: newAmount });
              } else if (newType === "income") {
                await debitAccount.decrement("reserved_balance", { by: newAmount });
              }
            }
          }
        }
      }
    }

    // Revert/Apply old/new debt payment impact
    if (hasCategoryChanged || hasAmountChanged || hasTypeChanged) {
      // 1. Revert old debt payment if old category had a debt
      if (oldCategoryId) {
        const oldDebt = await Debt.findOne({ where: { category_id: oldCategoryId } });
        if (oldDebt) {
          if (oldType === "expense") {
            await DebtPaymentProcessor.revertPayment(oldDebt.id, oldAmount);
          } else if (oldType === "income") {
            await DebtPaymentProcessor.processPayment(oldDebt.id, oldAmount);
          }
        }
      }

      // 2. Apply new debt payment if new category has a debt
      const newCategoryId = updateData.category_id !== undefined ? updateData.category_id : oldCategoryId;
      const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldAmount;
      const newType = updateData.type ?? oldType;

      if (newCategoryId) {
        const newDebt = await Debt.findOne({ where: { category_id: newCategoryId } });
        if (newDebt) {
          if (newType === "expense") {
            await DebtPaymentProcessor.processPayment(newDebt.id, newAmount);
          } else if (newType === "income") {
            await DebtPaymentProcessor.revertPayment(newDebt.id, newAmount);
          }
        }
      }
    }

    // Revert/Apply old/new savings goal impact
    if (hasCategoryChanged || hasAmountChanged || hasTypeChanged) {
      // 1. Revert old savings goal payment if it was linked to a savings goal
      if (oldSavingsGoalId) {
        await SavingsGoalProcessor.revertPayment(oldSavingsGoalId, oldAmount, oldType);
      }

      // 2. Determine new category and check if it's associated with a savings goal
      const newCategoryId = updateData.category_id !== undefined ? updateData.category_id : oldCategoryId;
      const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldAmount;
      const newType = updateData.type ?? oldType;

      if (newCategoryId) {
        const associatedGoal = await SavingsGoalProcessor.findAssociatedGoal(newCategoryId, userId);
        if (associatedGoal) {
          // Link it and apply new payment
          await transaction.update({ savings_goal_id: associatedGoal.id });
          await SavingsGoalProcessor.processPayment(associatedGoal.id, newAmount, newType);
        } else if (oldSavingsGoalId) {
          // Unlink it
          await transaction.update({ savings_goal_id: null as any });
        }
      } else if (oldSavingsGoalId) {
        // Unlink it
        await transaction.update({ savings_goal_id: null as any });
      }
    }

    return transaction;
  }

  /**
   * Eliminar una transacción
   */
  static async deleteTransaction(transactionId: string, userId: string) {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, user_id: userId },
    });

    if (!transaction) {
      return null;
    }

    // Revertir el impacto en el saldo de la cuenta antes de eliminar
    if (
      transaction.account_id &&
      transaction.amount != null &&
      transaction.type
    ) {
      const account = await Account.findByPk(transaction.account_id);
      if (account) {
        const revertDelta =
          transaction.type === "income"
            ? -Number(transaction.amount)
            : Number(transaction.amount);
        //Revertir el balance real
        await account.increment("balance", { by: revertDelta });
        // Revertir saldo reservado
        if (account.account_linked) {
          const debitAccount = await Account.findByPk(account.account_linked);
          if (debitAccount) {
            if (transaction.type === "expense") {
              //Si borramos un gasto,la deuda desaparece -> Reduce el saldo reservado
              await debitAccount.decrement("reserved_balance", {
                by: Number(transaction.amount),
              });
            } else if (transaction.type === "income") {
              // Si borramos un pago a la tarjeta, la deuda vuelve -> Sumamos al saldo reservado
              await debitAccount.increment("reserved_balance", {
                by: Number(transaction.amount),
              });
            }
          }
        }
      }
    }

    // Hook to revert debt payment if category is associated with a debt
    if (transaction.category_id && transaction.amount != null && transaction.type) {
      const debt = await Debt.findOne({ where: { category_id: transaction.category_id } });
      if (debt) {
        if (transaction.type === "expense") {
          await DebtPaymentProcessor.revertPayment(debt.id, Number(transaction.amount));
        } else if (transaction.type === "income") {
          await DebtPaymentProcessor.processPayment(debt.id, Number(transaction.amount));
        }
      }
    }

    // Hook to revert savings goal payment if associated
    if (transaction.savings_goal_id && transaction.amount != null && transaction.type) {
      await SavingsGoalProcessor.revertPayment(
        transaction.savings_goal_id,
        Number(transaction.amount),
        transaction.type || "expense"
      );
    }

    await transaction.destroy();
    return true;
  }

  /**
   * Busca transacciones del usuario usando criterios semánticos del agente.
   * Usado para UPDATE y DELETE para identificar la transacción objetivo.
   */
  static async searchByContext(
    userId: string,
    criteria: TransactionSearchCriteria,
  ) {
    const where: Record<string, unknown> = { user_id: userId };

    if (criteria.merchant) {
      where.merchant = { [Op.like]: `%${criteria.merchant}%` };
    }
    if (criteria.description) {
      where.description = { [Op.like]: `%${criteria.description}%` };
    }
    if (criteria.date) {
      const start = new Date(criteria.date);
      const end = new Date(criteria.date);
      end.setHours(23, 59, 59, 999);
      where.date = { [Op.between]: [start, end] };
    }

    return await Transaction.findAll({
      where: where as any,
      order: [["date", "DESC"]],
      limit: 5,
    });
  }

  /**
   * Consulta transacciones con filtros para responder preguntas del agente.
   */
  static async queryWithFilters(userId: string, filters: ITransactionFilters) {
    const where: Record<string, unknown> = { user_id: userId };

    if (filters.date_from || filters.date_to) {
      const from = filters.date_from
        ? new Date(filters.date_from)
        : new Date(0);
      const to = filters.date_to
        ? new Date(`${filters.date_to}T23:59:59.999`)
        : new Date();
      where.date = { [Op.between]: [from, to] };
    }
    if (filters.account_id) where.account_id = filters.account_id;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.type) where.type = filters.type;

    return await Transaction.findAll({
      where: where as any,
      include: [
        { model: Account, attributes: ["id", "name"] },
        { model: Category, attributes: ["id", "name"] },
      ],
      order: [["date", "DESC"]],
      limit: filters.limit ?? 20,
    });
  }
}
