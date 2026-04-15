import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1, 'El nombre de la cuenta es requerido'),
  balance: z
    .preprocess(
      (val) => (val !== undefined && val !== null ? Number(val) : val),
      z.number('El balance debe ser un número')
    ),
  type: z
    .string()
    .min(1, 'El tipo de cuenta es requerido'),
  account_linked: z.string().optional()
});

export const updateAccountSchema = z
  .object({
    name: z.string().min(1, 'El nombre de la cuenta no puede estar vacío').optional(),
    balance: z
      .preprocess(
        (val) => (val !== undefined ? Number(val) : undefined),
        z.number('El balance debe ser un número').optional()
      ),
    type: z
      .string()
      .min(1, 'El tipo de cuenta no puede estar vacío')
      .optional(),
    account_linked: z.string().optional()
  })
  .refine(
    (data) => data.name !== undefined || data.balance !== undefined || data.type !== undefined || data.account_linked !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

