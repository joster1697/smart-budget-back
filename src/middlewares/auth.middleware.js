"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const auth_service_1 = require("../services/auth.service");
// Middleware para verificar autenticación
const authenticate = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'No se proporcionó token de autenticación'
            });
        }
        // Verificar formato: "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: 'Formato de token inválido. Use: Bearer <token>'
            });
        }
        const token = parts[1];
        // Verificar el token
        try {
            const payload = auth_service_1.AuthService.verifyAccessToken(token);
            // Verificar que el payload tenga userId
            if (!payload.userId) {
                return res.status(401).json({ message: 'Token inválido: userId faltante' });
            }
            // Adjuntar la información del usuario al request
            req.user = {
                id: payload.userId,
                email: payload.email
            };
            next();
        }
        catch (error) {
            return res.status(401).json({
                message: 'Token inválido o expirado',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    catch (error) {
        console.error('Error en middleware authenticate:', error);
        return res.status(500).json({
            message: 'Error al verificar autenticación',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.authenticate = authenticate;
// Middleware opcional para verificar roles (para futura implementación)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Usuario no autenticado'
            });
        }
        // Aquí puedes agregar lógica para verificar roles
        // Por ejemplo, si agregas un campo 'role' al usuario
        // const userRole = req.user.role;
        // if (!roles.includes(userRole)) {
        //   return res.status(403).json({
        //     message: 'No tienes permisos para realizar esta acción'
        //   });
        // }
        next();
    };
};
exports.authorize = authorize;
