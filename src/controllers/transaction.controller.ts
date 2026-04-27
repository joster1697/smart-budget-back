// controllers/transaction.controller.ts
import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { TransactionService } from "../services/transaction.service";

/**
 * Obtener todas las transacciones del usuario autenticado
 * @route GET /api/transactions
 * @access Private
 */
export const getUserTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const transactions = await TransactionService.getTransactionsByUserId(userId);
    res.status(200).json({
      message: "Transacciones obtenidas exitosamente",
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una transacción específica por ID
 * @route GET /api/transactions/:id
 * @access Private
 */
export const getTransactionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const transaction = await TransactionService.getTransactionById(id, userId);

    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    res.status(200).json({
      message: "Transacción obtenida exitosamente",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva transacción
 * @route POST /api/transactions
 * @access Private
 */
export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { account_id, amount, category_id, type, description, date } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'No autenticado'
      });
    }

    const transactionData = {
      user_id: userId,
      account_id,
      amount,
      category_id,
      type,
      description,
      date,
    };

    const newTransaction = await TransactionService.createTransaction(transactionData);

    res.status(201).json({
      message: "Transacción creada exitosamente",
      transaction: newTransaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una transacción existente
 * @route PUT /api/transactions/:id
 * @access Private
 */
export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { account_id, amount, category_id, type, description, date } = req.body;

    const updated = await TransactionService.updateTransaction(id, userId, {
      account_id,
      amount,
      category_id,
      type,
      description,
      date,
    });

    if (!updated) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    res.status(200).json({
      message: "Transacción actualizada exitosamente",
      transaction: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una transacción
 * @route DELETE /api/transactions/:id
 * @access Private
 */
export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const deleted = await TransactionService.deleteTransaction(id, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    res.status(200).json({ message: "Transacción eliminada exitosamente" });
  } catch (error) {
    next(error);
  }
};

