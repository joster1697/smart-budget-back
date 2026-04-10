import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener almenos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  user_id: z
  .string()
  .uuid("El user_id debe ser un UUID valido"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener almenos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),
});
