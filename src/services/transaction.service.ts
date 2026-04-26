// services/transaction.service.ts
import { Op } from "sequelize";
import { Account } from "../database/models";
import { Transaction, TransactionCreationAttributes } from "../database/models/transaction";
import { User } from "../database/models/user";
import { TransactionSearchCriteria } from "./ai/ingestion.service";

// Interface para creación de transacciones
export interface ITransactionCreate {
  user_id: string;
  account_id: string;
  amount: number;
  category_id?: string;
  type: string;
  description: string;
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
  static async getTransactionsByUserId(userId: string) {
    return await Transaction.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
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

    // Si hay una cuenta vinculada, verificar que existe y pertenece al usuario
    if (transactionData.account_id) {
      const linkedAccount = await Account.findOne({
        where: {
          id: transactionData.account_id,
          user_id: transactionData.user_id,
        },
      });
      if (!linkedAccount) {
        throw new Error("La cuenta vinculada no existe o no pertenece al usuario");
      }
    }

    // Crear la transacción
    const transactionToCreate: TransactionCreationAttributes = {
      user_id: transactionData.user_id,
      account_id: transactionData.account_id,
      amount: transactionData.amount,
      category_id: transactionData.category_id,
      type: transactionData.type,
      description: transactionData.description,
    };

    const created = await Transaction.create(transactionToCreate);

    // Actualizar el saldo de la cuenta
    if (transactionData.account_id) {
      const account = await Account.findByPk(transactionData.account_id);
      if (account) {
        const delta = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
        await account.increment('balance', { by: delta });
      }
    }

    return created;
  }

  /**
   * Actualizar una transacción existente
   */
  static async updateTransaction(transactionId: string, userId: string, updateData: ITransactionUpdate) {
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
        throw new Error('La cuenta no existe o no pertenece al usuario');
      }
    }

    await transaction.update(updateData);

    // Recalcular el impacto en el saldo si cambia amount o type
    if (updateData.amount !== undefined || updateData.type !== undefined) {
      const oldAmount = Number(transaction.amount ?? 0);
      const oldType = transaction.type ?? 'expense';
      const newAmount = updateData.amount ?? oldAmount;
      const newType = updateData.type ?? oldType;

      const oldDelta = oldType === 'income' ? oldAmount : -oldAmount;
      const newDelta = newType === 'income' ? newAmount : -newAmount;
      const net = newDelta - oldDelta;

      if (net !== 0) {
        const accountId = updateData.account_id ?? transaction.account_id;
        if (accountId) {
          const account = await Account.findByPk(accountId);
          if (account) await account.increment('balance', { by: net });
        }
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
    if (transaction.account_id && transaction.amount != null && transaction.type) {
      const account = await Account.findByPk(transaction.account_id);
      if (account) {
        const revertDelta = transaction.type === 'income' ? -Number(transaction.amount) : Number(transaction.amount);
        await account.increment('balance', { by: revertDelta });
      }
    }

    await transaction.destroy();
    return true;
  }

  /**
   * Busca transacciones del usuario usando criterios semánticos del agente.
   * Usado para UPDATE y DELETE para identificar la transacción objetivo.
   */
  static async searchByContext(userId: string, criteria: TransactionSearchCriteria) {
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
      order: [['date', 'DESC']],
      limit: 5,
    });
  }
}
