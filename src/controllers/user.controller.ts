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

/**
 * Obtener un usuario por su ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en getUserById:", error);
    res.status(500).json({
      message: "Error al obtener el usuario",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Futuras funciones:
// export const updateUser = async (req: AuthRequest, res: Response) => { ... }
// export const deleteUser = async (req: AuthRequest, res: Response) => { ... }