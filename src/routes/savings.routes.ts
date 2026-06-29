import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  withdrawFromGoal,
  getGoalProjections,
  getSchedules,
  createSchedule,
  deleteSchedule,
  processSchedules,
  syncGoalWithBudget,
} from "../controllers/savings.controller";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createSavingsScheduleSchema,
  manualTransactionSchema,
  syncBudgetSchema,
} from "../validators/savings.validators";

const router = Router();

// Rutas de Metas de Ahorro
router.get("/goals", authenticate, getGoals);
router.get("/goals/:id", authenticate, getGoalById);
router.post("/goals", authenticate, validate(createSavingsGoalSchema), createGoal);
router.put("/goals/:id", authenticate, validate(updateSavingsGoalSchema), updateGoal);
router.delete("/goals/:id", authenticate, deleteGoal);

// Aportes y Retiros Manuales
router.post("/goals/:id/contribute", authenticate, validate(manualTransactionSchema), contributeToGoal);
router.post("/goals/:id/withdraw", authenticate, validate(manualTransactionSchema), withdrawFromGoal);

// Proyecciones y Presupuestos
router.get("/goals/:id/projections", authenticate, getGoalProjections);
router.post("/goals/:id/sync-budget", authenticate, validate(syncBudgetSchema), syncGoalWithBudget);


// Rutas de Ahorro Automático (Schedules)
router.get("/schedules", authenticate, getSchedules);
router.post("/schedules", authenticate, validate(createSavingsScheduleSchema), createSchedule);
router.delete("/schedules/:id", authenticate, deleteSchedule);

// Trigger manual para procesamiento de cobros
router.post("/schedules/process", authenticate, processSchedules);

export default router;
