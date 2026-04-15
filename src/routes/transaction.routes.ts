// routes/transaction.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTransactionSchema, updateTransactionSchema } from "../validators/transaction.validators";
import {
  getUserTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller";

const router = Router();

/**
 * @route   GET /api/transactions
 * @desc    Obtener todas las transacciones del usuario autenticado
 * @access  Private
 */
router.get("/", authenticate, getUserTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Obtener una transacción por ID
 * @access  Private
 */
router.get("/:id", authenticate, getTransactionById);

/**
 * @route   POST /api/transactions
 * @desc    Crear una nueva transacción
 * @access  Private
 */
router.post("/", authenticate, validate(createTransactionSchema), createTransaction);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Actualizar una transacción existente
 * @access  Private
 */
router.put("/:id", authenticate, validate(updateTransactionSchema), updateTransaction);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Eliminar una transacción
 * @access  Private
 */
router.delete("/:id", authenticate, deleteTransaction);

export default router;

