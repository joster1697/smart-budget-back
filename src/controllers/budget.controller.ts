import { NextFunction, Response } from "express";
import { BudgetService } from "../services/budget.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener un presupuesto por periodo
 * @route GET /api/budgets/:period
 * @access Private
 */
export const getBudgetByPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { period } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const budget = await BudgetService.getBudgetByPeriod(userId, period);

    if (!budget) {
      return res.status(404).json({ message: "Presupuesto no encontrado para este periodo" });
    }

    res.status(200).json({
      message: "Presupuesto obtenido exitosamente",
      budget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo presupuesto
 * @route POST /api/budgets
 * @access Private
 */
export const createBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { period, planned_income, categories } = req.body;

    const newBudget = await BudgetService.createBudget(userId, period, planned_income, categories);

    res.status(201).json({
      message: "Presupuesto creado exitosamente",
      budget: newBudget,
    });
  } catch (error: any) {
    if (error.message.includes("Ya existe")) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * Actualizar un presupuesto existente
 * @route PUT /api/budgets/:id
 * @access Private
 */
export const updateBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const updateData = req.body;

    const updatedBudget = await BudgetService.updateBudget(id, userId, updateData);

    res.status(200).json({
      message: "Presupuesto actualizado exitosamente",
      budget: updatedBudget,
    });
  } catch (error: any) {
    if (error.message.includes("No se puede modificar")) {
        return res.status(403).json({ message: error.message });
    }
    if (error.message.includes("no encontrado")) {
        return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
