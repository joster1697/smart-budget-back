"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getUsers = void 0;
const user_service_1 = require("../services/user.service");
/**
 * Obtener todos los usuarios con sus cuentas y transacciones
 * @route GET /api/users
 * @access Private
 */
const getUsers = async (req, res) => {
    try {
        const users = await user_service_1.UserService.getAllUsersWithAccounts();
        res.status(200).json({
            message: "Usuarios obtenidos exitosamente",
            users
        });
    }
    catch (error) {
        console.error("Error en getUsers:", error);
        res.status(500).json({
            message: "Error al obtener usuarios",
            error: error instanceof Error ? error.message : "Error desconocido"
        });
    }
};
exports.getUsers = getUsers;
/**
 * Obtener un usuario por su ID
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await user_service_1.UserService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json({
            message: "Usuario obtenido exitosamente",
            user
        });
    }
    catch (error) {
        console.error("Error en getUserById:", error);
        res.status(500).json({
            message: "Error al obtener el usuario",
            error: error instanceof Error ? error.message : "Error desconocido"
        });
    }
};
exports.getUserById = getUserById;
// Futuras funciones:
// export const updateUser = async (req: AuthRequest, res: Response) => { ... }
// export const deleteUser = async (req: AuthRequest, res: Response) => { ... }
