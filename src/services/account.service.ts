// services/account.service.ts
import { Op } from "sequelize";
import { Account, AccountCreationAttributes } from "../database/models/account";
import { User } from "../database/models/user";

export interface AccountSearchCriteria {
  name?: string;
  type?: string;
}

// Interface para creación de cuentas
export interface IAccountCreate {
  user_id: string;
  balance: number;
  name: string;
  account_linked?: string;
  type: string;
}

// Interface para actualización de cuentas
export interface IAccountUpdate {
  name?: string;
  balance?: number;
  account_linked?: string;
  type?: string;
}

export class AccountService {
  /**
   * Obtener todas las cuentas de un usuario
   */
  static async getAccountsByUserId(userId: string) {
    return await Account.findAll({
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
   * Obtener una cuenta por ID
   */
  static async getAccountById(accountId: string, userId: string) {
    return await Account.findOne({
      where: {
        id: accountId,
        user_id: userId, // Asegurarse que el usuario solo acceda a sus propias cuentas
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
   * Crear una nueva cuenta
   */
  static async createAccount(accountData: IAccountCreate) {
    // Verificar que el usuario existe
    const user = await User.findByPk(accountData.user_id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Si hay una cuenta vinculada, verificar que existe y pertenece al usuario
    if (accountData.account_linked) {
      const linkedAccount = await Account.findOne({
        where: {
          id: accountData.account_linked,
          user_id: accountData.user_id,
        },
      });
      if (!linkedAccount) {
        throw new Error(
          "La cuenta vinculada no existe o no pertenece al usuario",
        );
      }
    }

    // Crear la cuenta
    const accountToCreate: AccountCreationAttributes = {
      user_id: accountData.user_id,
      name: accountData.name,
      balance: accountData.balance,
      account_linked: accountData.account_linked,
      type: accountData.type,
    };

    return await Account.create(accountToCreate);
  }

  /**
   * Actualizar una cuenta
   */
  static async updateAccount(
    accountId: string,
    userId: string,
    updateData: IAccountUpdate,
  ) {
    // Buscar la cuenta y verificar que pertenece al usuario
    const account = await Account.findOne({
      where: {
        id: accountId,
        user_id: userId,
      },
    });

    if (!account) {
      throw new Error("Cuenta no encontrada o no autorizada");
    }

    // Si se está actualizando la cuenta vinculada, verificar que existe
    if (updateData.account_linked) {
      const linkedAccount = await Account.findOne({
        where: {
          id: updateData.account_linked,
          user_id: userId,
        },
      });
      if (!linkedAccount) {
        throw new Error(
          "La cuenta vinculada no existe o no pertenece al usuario",
        );
      }
    }

    // Actualizar la cuenta
    await account.update(updateData);
    return account;
  }

  /**
   * Eliminar una cuenta
   */
  static async deleteAccount(accountId: string, userId: string) {
    const account = await Account.findOne({
      where: {
        id: accountId,
        user_id: userId,
      },
    });

    if (!account) {
      throw new Error("Cuenta no encontrada o no autorizada");
    }

    await account.destroy();
    return { message: "Cuenta eliminada exitosamente" };
  }

  /**
   * Obtener el balance total de un usuario
   */
  static async getTotalBalance(userId: string) {
    const accounts = await Account.findAll({
      where: { user_id: userId },
      attributes: ["balance"],
    });

    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0,
    );

    return {
      total_accounts: accounts.length,
      total_balance: totalBalance,
    };
  }

  static async searchByContext(
    userId: string,
    criteria: AccountSearchCriteria,
  ) {
    const where: Record<string, unknown> = { user_id: userId };
    if (criteria.name) where.name = { [Op.like]: `%${criteria.name}%` };
    if (criteria.type) where.type = criteria.type;
    return await Account.findAll({
      where,
      attributes: ["id", "name", "type", "balance"],
      limit: 5,
      order: [["updatedAt", "DESC"]],
    });
  }

  // Vincular una cuenta (ej:Tarjeta) => a otra (ej:Cuenta de Debito)
  static async linkAccount(
    accountId: string,
    targetAccountId: string,
    userId: string,
  ) {
    //Buscamos la cuenta que queremnos vincular(tarjeta)
    const account = await Account.findOne({
      where: { id: accountId, user_id: userId },
    });
    if (!account)
      throw new Error("la cuenta principal no existe o no te pertenece");
    //Buscamos la cuenta destino(debito)
    const targetAccount = await Account.findOne({
      where: { id: targetAccountId, user_id: userId },
    });
    if (!targetAccount) {
      throw new Error("La cuenta a vincular no existe o no te pertenece");
    }
    //Las unimos
    await account.update({ account_linked: targetAccountId });
    return account;
  }

  // Desvincular una cuenta
  static async unlinkAccount(accountId: string, userId: string) {
    const account = await Account.findOne({
      where: { id: accountId, user_id: userId },
    });
    if (!account) {
      throw new Error("La cuenta no existe o no te pertenece");
    }
    // Quitamos el vinculo poniendolo en null o undefined
    await account.update({ account_linked: undefined });
    return account;
  }
}
