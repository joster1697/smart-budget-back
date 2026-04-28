import { z } from 'zod';

export const ingestTextSchema = z.object({
  input: z.string().min(1, 'El campo "input" es requerido y no puede estar vacío').trim(),
});
