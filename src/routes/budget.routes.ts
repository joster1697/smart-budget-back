import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getBudgetByPeriod, createBudget, updateBudget } from "../controllers/budget.controller";

const router = Router();

// Todas las rutas de presupuestos requieren autenticación
router.use(authenticate);

router.get("/:period", getBudgetByPeriod);
router.post("/", createBudget);
router.put("/:id", updateBudget);

export default router;
