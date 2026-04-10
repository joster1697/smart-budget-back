"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
// Registro de nuevo usuario
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Verificar si el usuario ya existe
        const existingUser = await user_service_1.UserService.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                message: 'El email ya está registrado'
            });
        }
        // Crear el usuario
        const user = await user_service_1.UserService.createUser({
            name,
            email,
            password
        });
        // Generar tokens (pasamos el objeto User completo)
        const tokens = auth_service_1.AuthService.generateTokens(user);
        // Remover el password de la respuesta
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: userWithoutPassword,
            tokens
        });
    }
    catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({
            message: 'Error al registrar el usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.register = register;
// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Intentar hacer login
        const result = await auth_service_1.AuthService.login(email, password);
        if (!result) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }
        res.status(200).json({
            message: 'Login exitoso',
            user: result.user,
            tokens: result.tokens
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            message: 'Error al iniciar sesión',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.login = login;
// Refresh token
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        // Intentar renovar los tokens
        const tokens = await auth_service_1.AuthService.refresh(refreshToken);
        if (!tokens) {
            return res.status(401).json({
                message: 'Refresh token inválido o expirado'
            });
        }
        res.status(200).json({
            message: 'Tokens renovados exitosamente',
            tokens
        });
    }
    catch (error) {
        console.error('Error en refresh:', error);
        res.status(500).json({
            message: 'Error al renovar los tokens',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.refresh = refresh;
// Logout (opcional - depende de si quieres implementar blacklist de tokens)
const logout = async (req, res) => {
    try {
        // En una implementación completa, aquí podrías:
        // 1. Agregar el token a una blacklist en Redis
        // 2. Eliminar refresh tokens de la base de datos
        // 3. Invalidar sesiones activas
        // Por ahora, solo retornamos un mensaje de éxito
        // El cliente debe eliminar los tokens del localStorage
        res.status(200).json({
            message: 'Logout exitoso. Por favor, elimina los tokens del cliente.'
        });
    }
    catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            message: 'Error al cerrar sesión',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.logout = logout;
// Obtener información del usuario autenticado
const me = async (req, res) => {
    try {
        // El middleware authenticate ya validó el token y adjuntó el usuario
        if (!req.user) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }
        // Obtener información completa del usuario
        const user = await user_service_1.UserService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }
        // Remover el password de la respuesta
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(200).json({
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Error en me:', error);
        res.status(500).json({
            message: 'Error al obtener información del usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.me = me;
