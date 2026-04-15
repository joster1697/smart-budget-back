// controllers/transaction.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { TransactionService } from "../services/transaction.service";

/**
 * Obtener todas las transacciones del usuario autenticado
 * @route GET /api/transactions
 * @access Private
 */
export const getUserTransactions = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en getUserTransactions:", error);
    res.status(500).json({
      message: "Error al obtener las transacciones",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener una transacción específica por ID
 * @route GET /api/transactions/:id
 * @access Private
 */
export const getTransactionById = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en getTransactionById:", error);
    res.status(500).json({
      message: "Error al obtener la transacción",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Crear una nueva transacción
 * @route POST /api/transactions
 * @access Private
 */
export const createTransaction = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en createTransaction:", error);
    res.status(500).json({
      message: "Error al crear la transacción",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Actualizar una transacción existente
 * @route PUT /api/transactions/:id
 * @access Private
 */
export const updateTransaction = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en updateTransaction:", error);
    res.status(500).json({
      message: "Error al actualizar la transacción",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Eliminar una transacción
 * @route DELETE /api/transactions/:id
 * @access Private
 */
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
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
    console.error("Error en deleteTransaction:", error);
    res.status(500).json({
      message: "Error al eliminar la transacción",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

