import { SavingsGoal, Account, Category } from "../database/models";

export class SavingsGoalProcessor {
  /**
   * Identifica si una categoría corresponde a una meta de ahorro y retorna la meta
   */
  static async findAssociatedGoal(categoryId: string, userId: string): Promise<SavingsGoal | null> {
    if (!categoryId) return null;
    
    const category = await Category.findOne({ where: { id: categoryId, user_id: userId } });
    if (!category) return null;

    if (category.name && category.name.toLowerCase().startsWith("ahorro:")) {
      const goalName = category.name.substring("ahorro:".length).trim();
      return await SavingsGoal.findOne({ where: { name: goalName, user_id: userId } });
    }
    return null;
  }

  /**
   * Procesa la adición de una transacción vinculada a una meta de ahorro
   */
  static async processPayment(goalId: string, amount: number, type: string) {
    const goal = await SavingsGoal.findByPk(goalId);
    if (!goal) return;

    const value = Number(amount);
    if (type === "expense") {
      // Un gasto en la categoría de ahorro incrementa lo ahorrado
      goal.current_amount = Number(goal.current_amount) + value;
      // Actualizar reserved_balance si hay una cuenta vinculada a la meta
      if (goal.account_id) {
        const account = await Account.findByPk(goal.account_id);
        if (account) {
          account.reserved_balance = Number(account.reserved_balance) + value;
          await account.save();
        }
      }
    } else if (type === "income") {
      // Un ingreso en la categoría de ahorro disminuye lo ahorrado (retiro)
      goal.current_amount = Math.max(0, Number(goal.current_amount) - value);
      if (goal.account_id) {
        const account = await Account.findByPk(goal.account_id);
        if (account) {
          account.reserved_balance = Math.max(0, Number(account.reserved_balance) - value);
          await account.save();
        }
      }
    }

    // Actualizar el estado de la meta
    const isCompleted = Number(goal.current_amount) >= Number(goal.target_amount);
    if (isCompleted) {
      goal.status = "COMPLETED";
    } else if (goal.status === "COMPLETED") {
      goal.status = "ACTIVE";
    }
    await goal.save();
  }

  /**
   * Revierte el impacto de una transacción en una meta de ahorro
   */
  static async revertPayment(goalId: string, amount: number, type: string) {
    const goal = await SavingsGoal.findByPk(goalId);
    if (!goal) return;

    const value = Number(amount);
    if (type === "expense") {
      // Revertir depósito: restar del acumulado
      goal.current_amount = Math.max(0, Number(goal.current_amount) - value);
      if (goal.account_id) {
        const account = await Account.findByPk(goal.account_id);
        if (account) {
          account.reserved_balance = Math.max(0, Number(account.reserved_balance) - value);
          await account.save();
        }
      }
    } else if (type === "income") {
      // Revertir retiro: sumar de vuelta al acumulado
      goal.current_amount = Number(goal.current_amount) + value;
      if (goal.account_id) {
        const account = await Account.findByPk(goal.account_id);
        if (account) {
          account.reserved_balance = Number(account.reserved_balance) + value;
          await account.save();
        }
      }
    }

    // Actualizar el estado de la meta
    const isCompleted = Number(goal.current_amount) >= Number(goal.target_amount);
    if (isCompleted) {
      goal.status = "COMPLETED";
    } else if (goal.status === "COMPLETED") {
      goal.status = "ACTIVE";
    }
    await goal.save();
  }
}
