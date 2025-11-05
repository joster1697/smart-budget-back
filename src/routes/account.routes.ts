// routes/account.routes.ts
import { Router } from "express";
import {
  getUserAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getTotalBalance,
} from "../controllers/account.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route   GET /api/accounts/balance/total
 * @desc    Obtener el balance total del usuario autenticado
 * @access  Private
 * @note    Esta ruta debe ir antes de /:id para evitar conflictos
 */
router.get("/balance/total", authenticate, getTotalBalance);

/**
 * @route   GET /api/accounts
 * @desc    Obtener todas las cuentas del usuario autenticado
 * @access  Private
 */
router.get("/", authenticate, getUserAccounts);

/**
 * @route   GET /api/accounts/:id
 * @desc    Obtener una cuenta específica por ID
 * @access  Private
 */
router.get("/:id", authenticate, getAccountById);

/**
 * @route   POST /api/accounts
 * @desc    Crear una nueva cuenta
 * @access  Private
 */
router.post("/", authenticate, createAccount);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Actualizar una cuenta existente
 * @access  Private
 */
router.put("/:id", authenticate, updateAccount);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Eliminar una cuenta
 * @access  Private
 */
router.delete("/:id", authenticate, deleteAccount);

export default router;
