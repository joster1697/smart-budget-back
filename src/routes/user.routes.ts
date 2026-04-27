import { Router } from "express";
import { getUsers, getUserById } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (requiere autenticación)
 * @access  Private
 */
router.get("/", authenticate, getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID (requiere autenticación)
 * @access  Private
 */
router.get("/:id", authenticate, getUserById);


export default router;