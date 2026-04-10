"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .min(2, "El nombre debe tener almenos 2 caracteres")
        .max(100, "El nombre no puede exceder los 100 caracteres"),
    user_id: zod_1.z
        .string()
        .uuid("El user_id debe ser un UUID valido"),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "El nombre debe tener almenos 2 caracteres")
        .max(100, "El nombre no puede exceder los 100 caracteres")
        .optional(),
});
