import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Debt } from "../database/models/debt";
import { Category } from "../database/models/category";
import { Budget } from "../database/models/budget";
import { BudgetCategory } from "../database/models/budget-category";
import { DebtExtractorService } from "../services/ai/debt-extractor.service";
import { DebtCalculatorService } from "../services/debt-calculator.service";
import { CryptoHelper } from "../services/security/crypto.helper";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const TEMP_DIR = path.join(process.cwd(), "temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract debt fields from uploaded PDF and save file to temp storage.
 * POST /api/debts/extract
 */
export const extractDebtFromPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha subido ningún archivo PDF" });
    }

    const fileBuffer = req.file.buffer;

    // Call Gemini OCR/LLM service
    const extractedData = await DebtExtractorService.extractFromPdf(fileBuffer);

    // Save PDF file to temp directory for compliance storage until validation
    const tempFileId = `debt_temp_${crypto.randomUUID()}.pdf`;
    const tempFilePath = path.join(TEMP_DIR, tempFileId);
    await fs.promises.writeFile(tempFilePath, fileBuffer);

    res.status(200).json({
      message: "PDF procesado exitosamente",
      data: extractedData,
      temp_file_id: tempFileId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates, encrypts sensitive data, saves debt to DB, and deletes temp file.
 * POST /api/debts/validate
 */
export const validateAndSaveDebt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const {
      name,
      currency,
      balance,
      interest_rate,
      total_installment,
      insurance_cost,
      other_fees,
      remaining_terms,
      operation_number,
      temp_file_id,
    } = req.body;

    if (
      !name ||
      !currency ||
      balance === undefined ||
      interest_rate === undefined ||
      total_installment === undefined ||
      remaining_terms === undefined
    ) {
      return res.status(400).json({ message: "Campos requeridos faltantes" });
    }

    // Encrypt operation number for AES-256 Compliance
    const opNumber = operation_number || "MANUAL_ENTRY";
    const operation_number_encrypted = CryptoHelper.encrypt(opNumber);

    // Write to DB
    const newDebt = await Debt.create({
      user_id: userId,
      name,
      currency,
      balance: Number(balance),
      interest_rate: Number(interest_rate),
      total_installment: Number(total_installment),
      insurance_cost: Number(insurance_cost || 0),
      other_fees: Number(other_fees || 0),
      remaining_terms: Number(remaining_terms),
      operation_number_encrypted,
    });

    // Compliance Deletion Policy: Delete temp PDF once saved
    if (temp_file_id) {
      const tempFilePath = path.join(TEMP_DIR, temp_file_id);
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch((err) => {
          console.error("Failed to delete temp file:", err);
        });
      }
    }

    res.status(201).json({
      message: "Deuda guardada exitosamente",
      debt: {
        id: newDebt.id,
        name: newDebt.name,
        currency: newDebt.currency,
        balance: newDebt.balance,
        interest_rate: newDebt.interest_rate,
        total_installment: newDebt.total_installment,
        insurance_cost: newDebt.insurance_cost,
        other_fees: newDebt.other_fees,
        remaining_terms: newDebt.remaining_terms,
        operation_number: opNumber,
        sync_budget: newDebt.sync_budget,
        planned_extra_payment: newDebt.planned_extra_payment
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all debts for authenticated user.
 * GET /api/debts
 */
export const getUserDebts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const debts = await Debt.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });

    const decryptedDebts = debts.map((debt) => {
      const opNum = CryptoHelper.decrypt(debt.operation_number_encrypted);
      return {
        id: debt.id,
        name: debt.name,
        currency: debt.currency,
        balance: debt.balance,
        interest_rate: debt.interest_rate,
        total_installment: debt.total_installment,
        insurance_cost: debt.insurance_cost,
        other_fees: debt.other_fees,
        remaining_terms: debt.remaining_terms,
        operation_number: opNum === "[DECRYPTION_ERROR]" ? "" : opNum,
        sync_budget: debt.sync_budget,
        planned_extra_payment: debt.planned_extra_payment,
        createdAt: debt.createdAt,
      };
    });

    res.status(200).json({
      message: "Deudas obtenidas exitosamente",
      debts: decryptedDebts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single debt details and full amortization schedule.
 * GET /api/debts/:id
 */
export const getDebtById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const debt = await Debt.findOne({
      where: { id, user_id: userId },
    });

    if (!debt) {
      return res.status(404).json({ message: "Deuda no encontrada" });
    }

    const opNum = CryptoHelper.decrypt(debt.operation_number_encrypted);
    const schedule = DebtCalculatorService.generateAmortizationSchedule(
      debt.balance,
      debt.interest_rate,
      debt.remaining_terms,
      debt.insurance_cost,
      debt.other_fees
    );

    res.status(200).json({
      message: "Detalles de la deuda obtenidos exitosamente",
      debt: {
        id: debt.id,
        name: debt.name,
        currency: debt.currency,
        balance: debt.balance,
        interest_rate: debt.interest_rate,
        total_installment: debt.total_installment,
        insurance_cost: debt.insurance_cost,
        other_fees: debt.other_fees,
        remaining_terms: debt.remaining_terms,
        operation_number: opNum === "[DECRYPTION_ERROR]" ? "" : opNum,
        sync_budget: debt.sync_budget,
        planned_extra_payment: debt.planned_extra_payment
      },
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate optimized schedule with extra payments.
 * POST /api/debts/:id/simulate
 */
export const simulateDebtSavings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { extra_payment_amount, extra_payment_type } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!extra_payment_amount || !extra_payment_type) {
      return res.status(400).json({ message: "Monto y tipo de abono son requeridos" });
    }

    const debt = await Debt.findOne({
      where: { id, user_id: userId },
    });

    if (!debt) {
      return res.status(404).json({ message: "Deuda no encontrada" });
    }

    const simulation = DebtCalculatorService.simulateExtraPayments(
      debt.balance,
      debt.interest_rate,
      debt.remaining_terms,
      debt.insurance_cost,
      debt.other_fees,
      Number(extra_payment_amount),
      extra_payment_type
    );

    res.status(200).json({
      message: "Simulación de pagos extraordinarios completada",
      simulation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a debt record.
 * DELETE /api/debts/:id
 */
export const deleteDebt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const debt = await Debt.findOne({
      where: { id, user_id: userId },
    });

    if (!debt) {
      return res.status(404).json({ message: "Deuda no encontrada o no pertenece al usuario" });
    }

    // Clean up budget allocation if it was synced
    if (debt.sync_budget) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;

      const budget = await Budget.findOne({
        where: { user_id: userId, period }
      });
      if (budget) {
        const category = await Category.findOne({
          where: { user_id: userId, name: debt.name }
        });
        if (category) {
          await BudgetCategory.destroy({
            where: { budget_id: budget.id, category_id: category.id }
          });
        }
      }
    }

    await debt.destroy();

    res.status(200).json({ message: "Deuda eliminada exitosamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * Synchronizes debt payments and scheduled extra payments with the user's budget.
 * POST /api/debts/:id/sync-budget
 */
export const syncDebtToBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { sync_budget, planned_extra_payment } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (sync_budget === undefined) {
      return res.status(400).json({ message: "El campo sync_budget es requerido" });
    }

    const debt = await Debt.findOne({
      where: { id, user_id: userId },
    });

    if (!debt) {
      return res.status(404).json({ message: "Deuda no encontrada" });
    }

    // 1. Update the debt record
    debt.sync_budget = Boolean(sync_budget);
    if (planned_extra_payment !== undefined) {
      debt.planned_extra_payment = Number(planned_extra_payment);
    }
    await debt.save();

    // 2. Find or create the category named after this specific debt
    let category = await Category.findOne({
      where: { user_id: userId, name: debt.name }
    });
    if (!category) {
      category = await Category.create({
        user_id: userId,
        name: debt.name
      });
    }

    // Link category to debt
    if (debt.category_id !== category.id) {
      debt.category_id = category.id;
      await debt.save();
    }

    // 3. Find or create the current period budget (YYYY-MM)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    let budget = await Budget.findOne({
      where: { user_id: userId, period }
    });
    if (!budget) {
      budget = await Budget.create({
        user_id: userId,
        period,
        planned_income: 0,
        status: "DRAFT"
      });
    }

    // 4. Calculate allocated budget amount for this specific debt
    const allocation = debt.sync_budget
      ? (Number(debt.total_installment || 0) + Number(debt.planned_extra_payment || 0))
      : 0;

    // 5. Update the budget category record
    let budgetCategory = await BudgetCategory.findOne({
      where: { budget_id: budget.id, category_id: category.id }
    });

    const isBudgetActive = budget.status === "ACTIVE";

    if (allocation > 0) {
      if (budgetCategory) {
        budgetCategory.allocated_amount = allocation;
        // Keep the original_allocated_amount untouched if active (indicates adjustment), or create it with 0 if it was null/0.
        if (isBudgetActive) {
          if (budgetCategory.original_allocated_amount === undefined || budgetCategory.original_allocated_amount === null) {
            budgetCategory.original_allocated_amount = 0;
          }
        } else {
          budgetCategory.original_allocated_amount = allocation;
        }
        await budgetCategory.save();
      } else {
        await BudgetCategory.create({
          budget_id: budget.id,
          category_id: category.id,
          allocated_amount: allocation,
          original_allocated_amount: isBudgetActive ? 0 : allocation
        });
      }
    } else {
      // If unsynced, remove the budget allocation for this specific debt category
      if (budgetCategory) {
        await budgetCategory.destroy();
      }
    }

    let warning = null;
    if (isBudgetActive && debt.sync_budget) {
      warning = `El presupuesto de este mes ya está activo. Hemos asignado el monto a la categoría "${debt.name}", pero te recomendamos revisar tu presupuesto para ajustar la distribución del dinero.`;
    }

    res.status(200).json({
      message: "Deuda sincronizada con el presupuesto exitosamente",
      debt: {
        id: debt.id,
        name: debt.name,
        sync_budget: debt.sync_budget,
        planned_extra_payment: debt.planned_extra_payment,
        total_installment: debt.total_installment,
        balance: debt.balance
      },
      budget_allocated: allocation,
      warning
    });
  } catch (error) {
    next(error);
  }
};
