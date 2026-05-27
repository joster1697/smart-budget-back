import { Budget } from "../database/models/budget";
import { BudgetCategory } from "../database/models/budget-category";
import { Transaction } from "../database/models/transaction";
import { Category } from "../database/models/category";
import { Op } from "sequelize";
import sequelize from "../database/config/sequelize";

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

    console.log("transactions: ", transactions);
    
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
        original_allocated_amount: Number(bc.original_allocated_amount ?? allocated),
        spent_amount: spent,
        remaining_amount: allocated - spent,
        usage_percentage: allocated > 0 ? (spent / allocated) * 100 : (spent > 0 ? 100 : 0),
        is_exceeded: spent > allocated
      };
    }) || [];

    // Encontrar categorías que tienen gastos pero no están en el presupuesto
    const budgetedCatIds = new Set(categoriesResponse.map(c => c.category_id));
    const unbudgetedCatIds = Object.keys(spentByCategory).filter(id => !budgetedCatIds.has(id));
    
    if (unbudgetedCatIds.length > 0) {
      const unbudgetedCategories = await Category.findAll({
        where: { id: unbudgetedCatIds },
        attributes: ['id', 'name']
      });

      for (const unbudgetedCat of unbudgetedCategories) {
        const spent = spentByCategory[unbudgetedCat.id] || 0;
        totalSpent += spent;
        categoriesResponse.push({
          id: `unbudgeted-${unbudgetedCat.id}`,
          category_id: unbudgetedCat.id,
          category_name: unbudgetedCat.name,
          allocated_amount: 0,
          original_allocated_amount: 0,
          spent_amount: spent,
          remaining_amount: -spent,
          usage_percentage: spent > 0 ? 100 : 0,
          is_exceeded: spent > 0
        });
      }
    }

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

    const wasDraft = budget.status === "DRAFT";
    const becomingActive = data.status === "ACTIVE" && wasDraft;

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
      const existingCats = await BudgetCategory.findAll({ where: { budget_id: budget.id } });
      const existingMap = new Map(existingCats.map(c => [c.category_id, c]));

      for (const cat of data.categories) {
        const existing = existingMap.get(cat.category_id);
        if (existing) {
          existing.allocated_amount = cat.allocated_amount;
          await existing.save();
        } else {
          await BudgetCategory.create({
            budget_id: budget.id,
            category_id: cat.category_id,
            allocated_amount: cat.allocated_amount,
            // Si ya está activo y se añade una nueva categoría, su original podría ser 0 o el asignado
            original_allocated_amount: budget.status === "ACTIVE" && !becomingActive ? 0 : cat.allocated_amount
          });
        }
      }
      
      const payloadCatIds = new Set(data.categories.map(c => c.category_id));
      const toDelete = existingCats.filter(c => !payloadCatIds.has(c.category_id)).map(c => c.id);
      if (toDelete.length > 0) {
        await BudgetCategory.destroy({ where: { id: toDelete } });
      }
    }

    // Si está pasando a ACTIVE, congelar los montos originales
    if (becomingActive) {
      await BudgetCategory.update(
        { original_allocated_amount: sequelize.literal('allocated_amount') },
        { where: { budget_id: budget.id } }
      );
    }

    return await this.getBudgetByPeriod(userId, budget.period!);
  }
}
