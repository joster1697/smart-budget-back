"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'El nombre es requerido')
        .min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: zod_1.z
        .string()
        .min(1, 'El correo es requerido')
        .email('Ingresa un correo electrónico válido'),
    password: zod_1.z
        .string()
        .min(1, 'La contraseña es requerida')
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número')
        .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'El correo es requerido')
        .email('Ingresa un correo electrónico válido'),
    password: zod_1.z
        .string()
        .min(1, 'La contraseña es requerida')
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z
        .string()
        .min(1, 'El refresh token es requerido')
});
