"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
// services/account.service.ts
const account_1 = require("../database/models/account");
const user_1 = require("../database/models/user");
class AccountService {
    /**
     * Obtener todas las cuentas de un usuario
     */
    static async getAccountsByUserId(userId) {
        return await account_1.Account.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: user_1.User,
                    attributes: ["id", "name", "email"],
                },
            ],
        });
    }
    /**
     * Obtener una cuenta por ID
     */
    static async getAccountById(accountId, userId) {
        return await account_1.Account.findOne({
            where: {
                id: accountId,
                user_id: userId, // Asegurarse que el usuario solo acceda a sus propias cuentas
            },
            include: [
                {
                    model: user_1.User,
                    attributes: ["id", "name", "email"],
                },
            ],
        });
    }
    /**
     * Crear una nueva cuenta
     */
    static async createAccount(accountData) {
        // Verificar que el usuario existe
        const user = await user_1.User.findByPk(accountData.user_id);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        // Si hay una cuenta vinculada, verificar que existe y pertenece al usuario
        if (accountData.account_linked) {
            const linkedAccount = await account_1.Account.findOne({
                where: {
                    id: accountData.account_linked,
                    user_id: accountData.user_id,
                },
            });
            if (!linkedAccount) {
                throw new Error("La cuenta vinculada no existe o no pertenece al usuario");
            }
        }
        // Crear la cuenta
        const accountToCreate = {
            user_id: accountData.user_id,
            balance: accountData.balance,
            account_linked: accountData.account_linked,
            type: accountData.type,
        };
        return await account_1.Account.create(accountToCreate);
    }
    /**
     * Actualizar una cuenta
     */
    static async updateAccount(accountId, userId, updateData) {
        // Buscar la cuenta y verificar que pertenece al usuario
        const account = await account_1.Account.findOne({
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
            const linkedAccount = await account_1.Account.findOne({
                where: {
                    id: updateData.account_linked,
                    user_id: userId,
                },
            });
            if (!linkedAccount) {
                throw new Error("La cuenta vinculada no existe o no pertenece al usuario");
            }
        }
        // Actualizar la cuenta
        await account.update(updateData);
        return account;
    }
    /**
     * Eliminar una cuenta
     */
    static async deleteAccount(accountId, userId) {
        const account = await account_1.Account.findOne({
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
    static async getTotalBalance(userId) {
        const accounts = await account_1.Account.findAll({
            where: { user_id: userId },
            attributes: ["balance"],
        });
        const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
        return {
            total_accounts: accounts.length,
            total_balance: totalBalance,
        };
    }
}
exports.AccountService = AccountService;
