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
import { validate } from "../middlewares/validate.middleware";
import { createAccountSchema, updateAccountSchema } from "../validators/account.validators";

const router = Router();

/**
 * @openapi
 * /api/accounts/balance/total:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Obtener el balance total del usuario
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Balance total calculado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 currency:
 *                   type: string
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/balance/total", authenticate, getTotalBalance);

/**
 * @openapi
 * /api/accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Obtener todas las cuentas del usuario
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de cuentas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Crear una nueva cuenta
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, balance, type]
 *             properties:
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit, cash, investment]
 *               account_linked:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Cuenta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
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
router.get("/", authenticate, getUserAccounts);

/**
 * @openapi
 * /api/accounts/{id}:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Obtener una cuenta por ID
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
 *         description: Cuenta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       '404':
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags:
 *       - Accounts
 *     summary: Actualizar una cuenta existente
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
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit, cash, investment]
 *               account_linked:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Cuenta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       '400':
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       '404':
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Accounts
 *     summary: Eliminar una cuenta
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
 *         description: Cuenta eliminada exitosamente
 *       '404':
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, getAccountById);

router.post("/", authenticate, validate(createAccountSchema), createAccount);

router.put("/:id", authenticate, validate(updateAccountSchema), updateAccount);

router.delete("/:id", authenticate, deleteAccount);

export default router;
