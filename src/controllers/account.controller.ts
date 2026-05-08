// controllers/account.controller.ts
import { NextFunction, Response } from "express";
import { AccountService } from "../services/account.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener todas las cuentas del usuario autenticado
 * @route GET /api/accounts
 * @access Private
 */
export const getUserAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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
    next(error);
  }
};

/**
 * Obtener una cuenta específica por ID
 * @route GET /api/accounts/:id
 * @access Private
 */
export const getAccountById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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
    next(error);
  }
};

/**
 * Crear una nueva cuenta
 * @route POST /api/accounts
 * @access Private
 */
export const createAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, balance, account_linked, type } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "No autenticado",
      });
    }

    const accountData = {
      user_id: userId,
      name,
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
    next(error);
  }
};

/**
 * Actualizar una cuenta existente
 * @route PUT /api/accounts/:id
 * @access Private
 */
export const updateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { name, balance, account_linked, type } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (balance !== undefined) updateData.balance = Number(balance);
    if (account_linked !== undefined)
      updateData.account_linked = account_linked;
    if (type !== undefined) updateData.type = type;

    const updatedAccount = await AccountService.updateAccount(
      id,
      userId,
      updateData,
    );

    res.status(200).json({
      message: "Cuenta actualizada exitosamente",
      account: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una cuenta
 * @route DELETE /api/accounts/:id
 * @access Private
 */
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const result = await AccountService.deleteAccount(id, userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener el balance total del usuario
 * @route GET /api/accounts/balance/total
 * @access Private
 */
export const getTotalBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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
    next(error);
  }
};

/**  Vincular una cuenta  a otra (ej:tarjeta a debito)
 *@route POST  /api/accounts/:id/link
 *@access Private
 */
export const linkAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params; //Sacamos id de la cuenta desde la URL
    const { targetAccountId } = req.body; // Sacamos el ID destino desde el cuerpo de la peticion

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    if (!targetAccountId) {
      return res.status(400).json({
        message: "Se requiere targetAccountId en el cuerpo de la peticion",
      });
    }

    //Llamado al servicio
    const linkedAccount = await AccountService.linkAccount(
      id,
      targetAccountId,
      userId,
    );

    res.status(200).json({
      message: "Cuenta vinculada satisfactoriamente",
      account: linkedAccount,
    });
  } catch (error) {
    next(error);
  }
};

/* Desvincular una cuenta
 * @route POST /api/accounts/:id/unlink
 * @access Private
 */

export const unlinkAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    //Llamado al servicio
    const unlinkedAccount = await AccountService.unlinkAccount(id, userId);

    res.status(200).json({
      message: "Cuenta desvinculada exitosamente",
      account: unlinkedAccount,
    });
  } catch (error) {
    next(error);
  }
};
