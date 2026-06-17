import { Debt } from "../database/models/debt";
import { DebtCalculatorService } from "./debt-calculator.service";

export class DebtPaymentProcessor {
  /**
   * Processes a transaction (expense) linked to a debt's category.
   * Decrements the debt balance (and terms, if it's a regular payment).
   */
  static async processPayment(debtId: string, amount: number) {
    const debt = await Debt.findByPk(debtId);
    if (!debt) return;

    const expectedInstallment = Number(debt.total_installment || 0);
    const diffRatio = expectedInstallment > 0 ? Math.abs(amount - expectedInstallment) / expectedInstallment : 1.0;
    
    const isRegularPayment = diffRatio <= 0.02; // within 2% tolerance

    if (isRegularPayment && debt.remaining_terms > 0) {
      // Calculate next term breakdown
      const schedule = DebtCalculatorService.generateAmortizationSchedule(
        debt.balance,
        debt.interest_rate,
        debt.remaining_terms,
        debt.insurance_cost,
        debt.other_fees
      );
      
      if (schedule.length > 0) {
        const nextTerm = schedule[0];
        // Reduce balance by the principal paid portion
        debt.balance = Math.max(0, debt.balance - nextTerm.principal_paid);
        debt.remaining_terms = Math.max(0, debt.remaining_terms - 1);
      }
    } else {
      // Extraordinary payment: full amount goes to reduce the principal balance
      debt.balance = Math.max(0, debt.balance - amount);
    }

    await debt.save();
  }

  /**
   * Reverts a previously processed transaction (expense) linked to a debt.
   * Increments the debt balance (and terms, if it was classified as a regular payment).
   */
  static async revertPayment(debtId: string, amount: number) {
    const debt = await Debt.findByPk(debtId);
    if (!debt) return;

    const expectedInstallment = Number(debt.total_installment || 0);
    const diffRatio = expectedInstallment > 0 ? Math.abs(amount - expectedInstallment) / expectedInstallment : 1.0;
    
    const isRegularPayment = diffRatio <= 0.02;

    if (isRegularPayment) {
      // Revert regular payment
      const monthlyRate = (debt.interest_rate / 12) / 100;
      let principalPaid = amount; // fallback
      if (monthlyRate > 0) {
        const annuity = expectedInstallment - Number(debt.insurance_cost || 0) - Number(debt.other_fees || 0);
        principalPaid = (annuity - debt.balance * monthlyRate) / (1 + monthlyRate);
      } else {
        principalPaid = amount - Number(debt.insurance_cost || 0) - Number(debt.other_fees || 0);
      }
      
      debt.balance = debt.balance + Number(principalPaid.toFixed(2));
      debt.remaining_terms = debt.remaining_terms + 1;
    } else {
      // Revert extraordinary payment: add full amount back to principal
      debt.balance = debt.balance + amount;
    }

    await debt.save();
  }
}
