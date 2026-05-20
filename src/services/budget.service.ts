import { Budget } from "../database/models/budget";
import { BudgetCategory } from "../database/models/budget-category";
import { Transaction } from "../database/models/transaction";
import { Category } from "../database/models/category";
import { Op } from "sequelize";

export interface BudgetCategoryInput {
  category_id: string;
  allocated_amount: number;
}

export class BudgetService {
  static async createBudget(userId: string, period: string, plannedIncome: number, categories: BudgetCategoryInput[]) {
    const existingBudget = await Budget.findOne({ where: { user_id: userId, period } });
    if (existingBudget) {
      throw new Error("Ya existe un presupuesto para este periodo");
    }

    const budget = await Budget.create({
      user_id: userId,
      period,
      planned_income: plannedIncome,
      status: "DRAFT"
    });

    if (categories && categories.length > 0) {
      const budgetCategories = categories.map(cat => ({
        budget_id: budget.id,
        category_id: cat.category_id,
        allocated_amount: cat.allocated_amount
      }));
      await BudgetCategory.bulkCreate(budgetCategories);
    }

    return await this.getBudgetByPeriod(userId, period);
  }

  static async getBudgetByPeriod(userId: string, period: string) {
    const budget = await Budget.findOne({
      where: { user_id: userId, period },
      include: [
        {
          model: BudgetCategory,
          include: [{ model: Category }]
        }
      ]
    });

    if (!budget) return null;

    // Calcular montos gastados
    const startDate = new Date(`${period}-01T00:00:00Z`);
    if (isNaN(startDate.getTime())) {
      throw new Error("Formato de periodo inválido. Use YYYY-MM");
    }
    
    // endDate is the first day of the next month
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        },
        type: 'expense'
      },
      attributes: ['category_id', 'amount']
    });

    const spentByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.category_id) {
        spentByCategory[t.category_id] = (spentByCategory[t.category_id] || 0) + Number(t.amount || 0);
      }
    }

    // Preparar respuesta
    let totalAllocated = 0;
    let totalSpent = 0;

    const categoriesResponse = budget.categories?.map(bc => {
      const allocated = Number(bc.allocated_amount || 0);
      const spent = spentByCategory[bc.category_id] || 0;
      totalAllocated += allocated;
      totalSpent += spent;

      return {
        id: bc.id,
        category_id: bc.category_id,
        category_name: bc.category?.name,
        allocated_amount: allocated,
        spent_amount: spent,
        remaining_amount: allocated - spent,
        usage_percentage: allocated > 0 ? (spent / allocated) * 100 : 0,
        is_exceeded: spent > allocated
      };
    }) || [];

    return {
      id: budget.id,
      period: budget.period,
      status: budget.status,
      planned_income: Number(budget.planned_income || 0),
      total_allocated: totalAllocated,
      total_spent: totalSpent,
      available_to_budget: Number(budget.planned_income || 0) - totalAllocated,
      categories: categoriesResponse
    };
  }

  static async updateBudget(id: string, userId: string, data: { planned_income?: number; status?: string; categories?: BudgetCategoryInput[] }) {
    const budget = await Budget.findOne({ where: { id, user_id: userId } });
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    // Validación de Inmutabilidad
    const today = new Date();
    const periodDate = new Date(`${budget.period}-01T00:00:00Z`);
    
    if (!isNaN(periodDate.getTime()) && today >= periodDate) {
      throw new Error("No se puede modificar un presupuesto de un periodo activo o pasado");
    }

    // Actualizar budget
    if (data.planned_income !== undefined) {
      budget.planned_income = data.planned_income;
    }
    if (data.status) {
      budget.status = data.status;
    }
    await budget.save();

    // Actualizar categories si vienen en el payload
    if (data.categories && Array.isArray(data.categories)) {
      await BudgetCategory.destroy({ where: { budget_id: budget.id } });
      const budgetCategories = data.categories.map((cat) => ({
        budget_id: budget.id,
        category_id: cat.category_id,
        allocated_amount: cat.allocated_amount
      }));
      await BudgetCategory.bulkCreate(budgetCategories);
    }

    return await this.getBudgetByPeriod(userId, budget.period!);
  }
}
