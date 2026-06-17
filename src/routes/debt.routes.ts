import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";
import {
  extractDebtFromPdf,
  validateAndSaveDebt,
  getUserDebts,
  getDebtById,
  simulateDebtSavings,
  deleteDebt,
  syncDebtToBudget,
} from "../controllers/debt.controller";

const router = Router();

// Configure Multer for memory buffer storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF.") as any, false);
    }
  },
});

/**
 * @openapi
 * /api/debts/extract:
 *   post:
 *     tags:
 *       - Debts
 *     summary: Extraer datos financieros de un PDF de estado de cuenta
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Datos extraídos exitosamente
 *       '400':
 *         description: Archivo inválido o ausente
 */
router.post("/extract", authenticate, upload.single("file"), extractDebtFromPdf);

/**
 * @openapi
 * /api/debts/validate:
 *   post:
 *     tags:
 *       - Debts
 *     summary: Validar y guardar una deuda (vía PDF o manual)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, currency, balance, interest_rate, total_installment, remaining_terms]
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *                 enum: [CRC, USD]
 *               balance:
 *                 type: number
 *               interest_rate:
 *                 type: number
 *               total_installment:
 *                 type: number
 *               insurance_cost:
 *                 type: number
 *               other_fees:
 *                 type: number
 *               remaining_terms:
 *                 type: number
 *               operation_number:
 *                 type: string
 *               temp_file_id:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Deuda guardada exitosamente
 */
router.post("/validate", authenticate, validateAndSaveDebt);

/**
 * @openapi
 * /api/debts:
 *   get:
 *     tags:
 *       - Debts
 *     summary: Obtener todas las deudas registradas del usuario
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de deudas obtendidas
 */
router.get("/", authenticate, getUserDebts);

/**
 * @openapi
 * /api/debts/{id}:
 *   get:
 *     tags:
 *       - Debts
 *     summary: Obtener detalles de una deuda y su tabla de amortización base
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
 *         description: Detalles y amortización de la deuda
 *       '404':
 *         description: Deuda no encontrada
 */
router.get("/:id", authenticate, getDebtById);

/**
 * @openapi
 * /api/debts/{id}/simulate:
 *   post:
 *     tags:
 *       - Debts
 *     summary: Simular el impacto de abonos extraordinarios en una deuda
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
 *             required: [extra_payment_amount, extra_payment_type]
 *             properties:
 *               extra_payment_amount:
 *                 type: number
 *               extra_payment_type:
 *                 type: string
 *                 enum: [one_time, monthly]
 *     responses:
 *       '200':
 *         description: Simulación completada
 *       '404':
 *         description: Deuda no encontrada
 */
router.post("/:id/simulate", authenticate, simulateDebtSavings);

/**
 * @openapi
 * /api/debts/{id}/sync-budget:
 *   post:
 *     tags:
 *       - Debts
 *     summary: Sincronizar pago de deuda y abonos con el presupuesto actual
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
 *             required: [sync_budget]
 *             properties:
 *               sync_budget:
 *                 type: boolean
 *               planned_extra_payment:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Sincronización exitosa
 *       '404':
 *         description: Deuda no encontrada
 */
router.post("/:id/sync-budget", authenticate, syncDebtToBudget);

/**
 * @openapi
 * /api/debts/{id}:
 *   delete:
 *     tags:
 *       - Debts
 *     summary: Eliminar una deuda registrada
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
 *         description: Deuda eliminada
 *       '404':
 *         description: Deuda no encontrada
 */
router.delete("/:id", authenticate, deleteDebt);

export default router;
