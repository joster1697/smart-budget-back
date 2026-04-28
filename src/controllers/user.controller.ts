// controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener todos los usuarios con sus cuentas y transacciones
 * @route GET /api/users
 * @access Private
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getAllUsersWithAccounts();
    res.status(200).json({
      message: "Usuarios obtenidos exitosamente",
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un usuario por su ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      message: "Usuario obtenido exitosamente",
      user
    });
  } catch (error) {
    next(error);
  }
};


// Futuras funciones:
// export const updateUser = async (req: AuthRequest, res: Response) => { ... }
// export const deleteUser = async (req: AuthRequest, res: Response) => { ... }