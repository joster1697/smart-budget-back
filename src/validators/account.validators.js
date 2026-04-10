"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccountSchema = exports.createAccountSchema = void 0;
const zod_1 = require("zod");
exports.createAccountSchema = zod_1.z.object({
    balance: zod_1.z
        .preprocess((val) => (val !== undefined && val !== null ? Number(val) : val), zod_1.z.number('El balance debe ser un número')),
    type: zod_1.z
        .string()
        .min(1, 'El tipo de cuenta es requerido'),
    account_linked: zod_1.z.string().optional()
});
exports.updateAccountSchema = zod_1.z
    .object({
    balance: zod_1.z
        .preprocess((val) => (val !== undefined ? Number(val) : undefined), zod_1.z.number('El balance debe ser un número').optional()),
    type: zod_1.z
        .string()
        .min(1, 'El tipo de cuenta no puede estar vacío')
        .optional(),
    account_linked: zod_1.z.string().optional()
})
    .refine((data) => data.balance !== undefined || data.type !== undefined || data.account_linked !== undefined, { message: 'Debe proporcionar al menos un campo para actualizar' });
