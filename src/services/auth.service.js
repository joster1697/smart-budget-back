"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../database/models/user");
class AuthService {
    // Generar Access Token (corta duración)
    static generateAccessToken(payload) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });
    }
    // Generar Refresh Token (larga duración)
    static generateRefreshToken(payload) {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });
    }
    // Generar ambos tokens
    static generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email
        };
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }
    // Verificar Access Token
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    // Verificar Refresh Token
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    // Login: verificar credenciales
    static async login(email, password) {
        // Buscar usuario
        const user = await user_1.User.findOne({ where: { email } });
        if (!user) {
            return null;
        }
        // Verificar password
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return null;
        }
        // Generar tokens
        const tokens = this.generateTokens(user);
        // Remover password del usuario
        const { password: _, ...userWithoutPassword } = user.toJSON();
        return {
            user: userWithoutPassword,
            tokens
        };
    }
    // Refresh: renovar Access Token
    static async refresh(refreshToken) {
        // Verificar Refresh Token
        const payload = this.verifyRefreshToken(refreshToken);
        // Buscar usuario (verificar que aún existe)
        const user = await user_1.User.findByPk(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Generar nuevos tokens
        return this.generateTokens(user);
    }
}
exports.AuthService = AuthService;
