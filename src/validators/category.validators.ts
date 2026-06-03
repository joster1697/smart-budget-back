import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener almenos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener almenos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),
});
