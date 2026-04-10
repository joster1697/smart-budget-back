import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'El refresh token es requerido')
});

