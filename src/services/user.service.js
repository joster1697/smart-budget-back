"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_1 = require("../database/models/user");
const account_1 = require("../database/models/account");
const transaction_1 = require("../database/models/transaction");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    static async getAllUsersWithAccounts() {
        return await user_1.User.findAll({
            include: [{ model: account_1.Account }, { model: transaction_1.Transaction }],
            attributes: { exclude: ["password"] }, // No devolver contraseñas
        });
    }
    static async createUser(userData) {
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        const userToCreate = {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
        };
        return await user_1.User.create(userToCreate);
    }
    static async getUserById(id) {
        return await user_1.User.findByPk(id, {
            attributes: { exclude: ["password"] },
        });
    }
    static async getUserByEmail(email) {
        return await user_1.User.findOne({
            where: { email }
        });
    }
    static async updateUser(id, userData) {
        const user = await user_1.User.findByPk(id);
        if (!user)
            throw new Error("User not found");
        if (userData.password) {
            userData.password = await bcrypt_1.default.hash(userData.password, 10);
        }
        return await user.update(userData);
    }
}
exports.UserService = UserService;
