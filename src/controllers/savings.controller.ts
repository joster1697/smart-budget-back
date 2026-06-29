import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { SavingsService } from "../services/savings.service";

const savingsService = new SavingsService();

/**
 * Obtener todas las metas de ahorro
 * @route GET /api/savings/goals
 */
export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const goals = await savingsService.getGoals(userId);
    res.status(200).json({
      message: "Metas de ahorro obtenidas exitosamente",
      goals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una meta de ahorro por ID
 * @route GET /api/savings/goals/:id
 */
export const getGoalById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const goal = await savingsService.getGoalById(userId, id);
    if (!goal) {
      return res.status(404).json({ message: "Meta de ahorro no encontrada" });
    }

    res.status(200).json({
      message: "Meta de ahorro obtenida exitosamente",
      goal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva meta de ahorro
 * @route POST /api/savings/goals
 */
export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const newGoal = await savingsService.createGoal(userId, req.body);
    res.status(201).json({
      message: "Meta de ahorro creada exitosamente",
      goal: newGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una meta de ahorro existente
 * @route PUT /api/savings/goals/:id
 */
export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const updatedGoal = await savingsService.updateGoal(userId, id, req.body);
    res.status(200).json({
      message: "Meta de ahorro actualizada exitosamente",
      goal: updatedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una meta de ahorro
 * @route DELETE /api/savings/goals/:id
 */
export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    await savingsService.deleteGoal(userId, id);
    res.status(200).json({
      message: "Meta de ahorro eliminada exitosamente y saldo reservado liberado",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Depositar/aportar saldo manualmente a una meta de ahorro
 * @route POST /api/savings/goals/:id/contribute
 */
export const contributeToGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { amount, account_id } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const updatedGoal = await savingsService.contributeToGoal(userId, id, Number(amount), account_id);
    res.status(200).json({
      message: "Aporte realizado exitosamente",
      goal: updatedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retirar saldo acumulado de una meta de ahorro
 * @route POST /api/savings/goals/:id/withdraw
 */
export const withdrawFromGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { amount, account_id } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const updatedGoal = await savingsService.withdrawFromGoal(userId, id, Number(amount), account_id);
    res.status(200).json({
      message: "Retiro realizado exitosamente",
      goal: updatedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener proyecciones y simulaciones
 * @route GET /api/savings/goals/:id/projections
 */
export const getGoalProjections = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const projections = await savingsService.getGoalProjections(userId, id);
    res.status(200).json({
      message: "Proyecciones generadas exitosamente",
      projections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener programaciones de ahorro automático del usuario
 * @route GET /api/savings/schedules
 */
export const getSchedules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const schedules = await savingsService.getSchedules(userId);
    res.status(200).json({
      message: "Programaciones obtenidas exitosamente",
      schedules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva programación de ahorro automático
 * @route POST /api/savings/schedules
 */
export const createSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const schedule = await savingsService.createSchedule(userId, req.body);
    res.status(201).json({
      message: "Programación de ahorro creada exitosamente",
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una programación
 * @route DELETE /api/savings/schedules/:id
 */
export const deleteSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    await savingsService.deleteSchedule(userId, id);
    res.status(200).json({
      message: "Programación de ahorro eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ejecutar manualmente el cobro de ahorros vencidos (Trigger para pruebas/cron)
 * @route POST /api/savings/schedules/process
 */
export const processSchedules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Para simplificar, permitimos que cualquier usuario autenticado dispare el procesamiento
    // de su ahorro programado (o de todo el sistema).
    const results = await savingsService.processDueSchedules();
    res.status(200).json({
      message: "Procesamiento de ahorros recurrentes completado",
      results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vincular cuota de ahorro con un presupuesto mensual
 * @route POST /api/savings/goals/:id/sync-budget
 */
export const syncGoalWithBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { period, amount, category_id } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const budgetCategory = await savingsService.syncGoalWithBudget(
      userId,
      id,
      period,
      Number(amount),
      category_id
    );

    res.status(200).json({
      message: "Cuota de ahorro añadida al presupuesto exitosamente",
      budgetCategory,
    });
  } catch (error) {
    next(error);
  }
};

