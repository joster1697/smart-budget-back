"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/account.routes.ts
const express_1 = require("express");
const account_controller_1 = require("../controllers/account.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const account_validators_1 = require("../validators/account.validators");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/accounts/balance/total
 * @desc    Obtener el balance total del usuario autenticado
 * @access  Private
 * @note    Esta ruta debe ir antes de /:id para evitar conflictos
 */
router.get("/balance/total", auth_middleware_1.authenticate, account_controller_1.getTotalBalance);
/**
 * @route   GET /api/accounts
 * @desc    Obtener todas las cuentas del usuario autenticado
 * @access  Private
 */
router.get("/", auth_middleware_1.authenticate, account_controller_1.getUserAccounts);
/**
 * @route   GET /api/accounts/:id
 * @desc    Obtener una cuenta específica por ID
 * @access  Private
 */
router.get("/:id", auth_middleware_1.authenticate, account_controller_1.getAccountById);
/**
 * @route   POST /api/accounts
 * @desc    Crear una nueva cuenta
 * @access  Private
 */
router.post("/", auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(account_validators_1.createAccountSchema), account_controller_1.createAccount);
/**
 * @route   PUT /api/accounts/:id
 * @desc    Actualizar una cuenta existente
 * @access  Private
 */
router.put("/:id", auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(account_validators_1.updateAccountSchema), account_controller_1.updateAccount);
/**
 * @route   DELETE /api/accounts/:id
 * @desc    Eliminar una cuenta
 * @access  Private
 */
router.delete("/:id", auth_middleware_1.authenticate, account_controller_1.deleteAccount);
exports.default = router;
