import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post('/refresh', validate(refreshSchema), refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar tokens)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, me);

export default router;
