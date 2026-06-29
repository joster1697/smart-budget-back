import { z } from "zod";

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, "El nombre de la meta de ahorro es requerido"),
  target_amount: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 0),
    z.number().nonnegative("El monto objetivo debe ser mayor o igual a 0")
  ).optional(),
  target_date: z
    .preprocess(
      (val) => (val && val !== "" ? new Date(val as string) : undefined),
      z.date().optional()
    )
    .refine(
      (date) => !date || date > new Date(),
      { message: "La fecha objetivo debe ser en el futuro" }
    ),
  account_id: z.string().uuid("ID de cuenta inválido").optional(),
  category: z.string().optional(),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  target_amount: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().nonnegative("El monto objetivo debe ser mayor o igual a 0").optional()
  ).optional(),
  target_date: z
    .preprocess(
      (val) => (val && val !== "" ? new Date(val as string) : undefined),
      z.date().optional()
    )
    .refine(
      (date) => !date || date > new Date(),
      { message: "La fecha objetivo debe ser en el futuro" }
    ),
  account_id: z.string().uuid("ID de cuenta inválido").nullable().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).optional(),
  category: z.string().optional(),
});

export const createSavingsScheduleSchema = z.object({
  savings_goal_id: z.string().uuid("ID de meta de ahorro inválido"),
  source_account_id: z.string().uuid("ID de cuenta origen inválido"),
  amount: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : val),
    z.number().positive("El monto debe ser mayor a 0")
  ),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  day_of_week: z.number().min(1).max(7).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
});

export const updateSavingsScheduleSchema = z.object({
  amount: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().positive("El monto debe ser mayor a 0").optional()
  ).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  day_of_week: z.number().min(1).max(7).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export const manualTransactionSchema = z.object({
  amount: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : val),
    z.number().positive("El monto debe ser mayor a 0")
  ),
  account_id: z.string().uuid("ID de cuenta inválido").optional(),
});

export const syncBudgetSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "El periodo debe tener el formato YYYY-MM"),
  amount: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : val),
    z.number().nonnegative("El monto debe ser mayor o igual a 0")
  ),
  category_id: z.string().uuid("ID de categoría inválido").optional(),
});

