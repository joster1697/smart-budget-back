// services/user.service.ts
import sequelize from "../database/config/sequelize";
import { UserCreationAttributes } from "../database/models/user";
import { User } from "../database/models/user";
import { Account } from "../database/models/account";
import { Transaction } from "../database/models/transaction";
import bcrypt from "bcrypt";

// Interface para creación de usuarios
export interface IUserCreate {
  name: string;
  email: string;
  password: string;
}

// Interface para actualización de usuarios
export interface IUserUpdate {
  name?: string;
  email?: string;
  password?: string;
}

export class UserService {
  static async getAllUsersWithAccounts() {
    return await User.findAll({
      include: [{ model: Account }, { model: Transaction }],
      attributes: { exclude: ["password"] }, // No devolver contraseñas
    });
  }

  static async createUser(userData: IUserCreate) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userToCreate: UserCreationAttributes = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    };
    return await User.create(userToCreate);
  }

  static async getUserById(id: string) {
    return await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
  }

  static async getUserByEmail(email: string) {
    return await User.findOne({
      where: { email }
    });
  }

  static async updateUser(id: string, userData: IUserUpdate) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    return await user.update(userData);
  }
}
