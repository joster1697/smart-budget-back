// controllers/account.controller.ts
import { Response } from "express";
import { AccountService } from "../services/account.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener todas las cuentas del usuario autenticado
 * @route GET /api/accounts
 * @access Private
 */
export const getUserAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const accounts = await AccountService.getAccountsByUserId(userId);
    res.status(200).json({
      message: "Cuentas obtenidas exitosamente",
      accounts,
    });
  } catch (error) {
    console.error("Error en getUserAccounts:", error);
    res.status(500).json({
      message: "Error al obtener las cuentas",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener una cuenta específica por ID
 * @route GET /api/accounts/:id
 * @access Private
 */
export const getAccountById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const account = await AccountService.getAccountById(id, userId);

    if (!account) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    res.status(200).json({
      message: "Cuenta obtenida exitosamente",
      account,
    });
  } catch (error) {
    console.error("Error en getAccountById:", error);
    res.status(500).json({
      message: "Error al obtener la cuenta",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Crear una nueva cuenta
 * @route POST /api/accounts
 * @access Private
 */
export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { balance, account_linked, type } = req.body;

    // Validaciones
    if (balance === undefined || balance === null) {
      return res.status(400).json({ message: "El balance es requerido" });
    }

    if (!type) {
      return res.status(400).json({ message: "El tipo de cuenta es requerido" });
    }

    // Validar que el balance sea un número
    if (isNaN(balance)) {
      return res.status(400).json({ message: "El balance debe ser un número" });
    }

    const accountData = {
      user_id: userId,
      balance: Number(balance),
      account_linked,
      type,
    };

    const newAccount = await AccountService.createAccount(accountData);

    res.status(201).json({
      message: "Cuenta creada exitosamente",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error en createAccount:", error);
    res.status(500).json({
      message: "Error al crear la cuenta",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Actualizar una cuenta existente
 * @route PUT /api/accounts/:id
 * @access Private
 */
export const updateAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { balance, account_linked, type } = req.body;

    // Validar que al menos un campo esté presente
    if (!balance && !account_linked && !type) {
      return res.status(400).json({
        message: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    const updateData: any = {};
    if (balance !== undefined) updateData.balance = Number(balance);
    if (account_linked !== undefined) updateData.account_linked = account_linked;
    if (type !== undefined) updateData.type = type;

    const updatedAccount = await AccountService.updateAccount(
      id,
      userId,
      updateData
    );

    res.status(200).json({
      message: "Cuenta actualizada exitosamente",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Error en updateAccount:", error);
    res.status(500).json({
      message: "Error al actualizar la cuenta",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Eliminar una cuenta
 * @route DELETE /api/accounts/:id
 * @access Private
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const result = await AccountService.deleteAccount(id, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error en deleteAccount:", error);
    res.status(500).json({
      message: "Error al eliminar la cuenta",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener el balance total del usuario
 * @route GET /api/accounts/balance/total
 * @access Private
 */
export const getTotalBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const balanceInfo = await AccountService.getTotalBalance(userId);

    res.status(200).json({
      message: "Balance total obtenido exitosamente",
      ...balanceInfo,
    });
  } catch (error) {
    console.error("Error en getTotalBalance:", error);
    res.status(500).json({
      message: "Error al obtener el balance total",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};
