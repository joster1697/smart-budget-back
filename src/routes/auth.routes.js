"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_validators_1 = require("../validators/auth.validators");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', (0, validate_middleware_1.validate)(auth_validators_1.registerSchema), auth_controller_1.register);
/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', (0, validate_middleware_1.validate)(auth_validators_1.loginSchema), auth_controller_1.login);
/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post('/refresh', (0, validate_middleware_1.validate)(auth_validators_1.refreshSchema), auth_controller_1.refresh);
/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar tokens)
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.logout);
/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.me);
exports.default = router;
