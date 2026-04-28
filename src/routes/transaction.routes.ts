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
 * @openapi
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Obtener todas las transacciones del usuario
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cuenta
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por categoría
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       '200':
 *         description: Lista de transacciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Crear una nueva transacción
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [account_id, amount, type]
 *             properties:
 *               account_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               description:
 *                 type: string
 *                 maxLength: 255
 *               merchant:
 *                 type: string
 *                 maxLength: 255
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: Transacción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       '400':
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, getUserTransactions);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Obtener una transacción por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Transacción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       '404':
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Actualizar una transacción existente
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               description:
 *                 type: string
 *               merchant:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Transacción actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       '400':
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       '404':
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Eliminar una transacción
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '204':
 *         description: Transacción eliminada exitosamente
 *       '404':
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, getTransactionById);

router.post("/", authenticate, validate(createTransactionSchema), createTransaction);

router.put("/:id", authenticate, validate(updateTransactionSchema), updateTransaction);

router.delete("/:id", authenticate, deleteTransaction);

export default router;

