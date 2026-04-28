import { z } from 'zod';

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;

export const createTransactionSchema = z.object({
  account_id: z
    .string()
    .uuid('El ID de cuenta no es válido'),
  amount: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : val),
    z
      .number('El monto debe ser un número')
      .positive('El monto debe ser mayor a 0')
  ),
  category_id: z.string().uuid('El ID de categoría no es válido').optional(),
  type: z.enum(TRANSACTION_TYPES, {
    message: `El tipo debe ser uno de: ${TRANSACTION_TYPES.join(', ')}`,
  }),
  description: z.string().max(255, 'La descripción no puede superar los 255 caracteres').optional(),
  merchant: z.string().max(255, 'El comercio no puede superar los 255 caracteres').optional(),
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date({ message: 'La fecha no es válida' }).optional()
  ),
});

export const updateTransactionSchema = z
  .object({
    account_id: z.string().uuid('El ID de cuenta no es válido').optional(),
    amount: z
      .preprocess(
        (val) => (val !== undefined ? Number(val) : undefined),
        z.number().positive('El monto debe ser mayor a 0').optional()
      ),
    category_id: z.string().uuid('El ID de categoría no es válido').optional(),
    type: z
      .enum(TRANSACTION_TYPES, {
        message: `El tipo debe ser uno de: ${TRANSACTION_TYPES.join(', ')}`,
      })
      .optional(),
    description: z
      .string()
      .max(255, 'La descripción no puede superar los 255 caracteres')
      .optional(),
    merchant: z
      .string()
      .max(255, 'El comercio no puede superar los 255 caracteres')
      .optional(),
    date: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date({ message: 'La fecha no es válida' }).optional()
    ),
  })
  .refine(
    (data) =>
      data.account_id !== undefined ||
      data.amount !== undefined ||
      data.category_id !== undefined ||
      data.type !== undefined ||
      data.description !== undefined ||
      data.merchant !== undefined ||
      data.date !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

