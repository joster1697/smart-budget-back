// controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener todos los usuarios con sus cuentas y transacciones
 * @route GET /api/users
 * @access Private
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsersWithAccounts();
    res.status(200).json({
      message: "Usuarios obtenidos exitosamente",
      users
    });
  } catch (error) {
    console.error("Error en getUsers:", error);
    res.status(500).json({ 
      message: "Error al obtener usuarios",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Futuras funciones:
// export const getUserById = async (req: AuthRequest, res: Response) => { ... }
// export const updateUser = async (req: AuthRequest, res: Response) => { ... }
// export const deleteUser = async (req: AuthRequest, res: Response) => { ... }