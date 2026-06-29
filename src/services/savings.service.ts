import { sequelize, SavingsGoal, SavingsSchedule, Account, Transaction, Budget, BudgetCategory, Category } from "../database/models";
import { addDays, addMonths, addWeeks, differenceInMonths, isAfter } from "date-fns";
import { Op } from "sequelize";

export class SavingsService {
  /**
   * Obtener todas las metas de ahorro del usuario
   */
  async getGoals(userId: string): Promise<SavingsGoal[]> {
    return SavingsGoal.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Account,
          attributes: ["id", "name", "balance", "reserved_balance"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Obtener una meta de ahorro por ID
   */
  async getGoalById(userId: string, goalId: string): Promise<SavingsGoal | null> {
    return SavingsGoal.findOne({
      where: { id: goalId, user_id: userId },
      include: [
        {
          model: Account,
          attributes: ["id", "name", "balance", "reserved_balance"],
        },
        {
          model: SavingsSchedule,
          where: { status: "ACTIVE" },
          required: false,
        },
      ],
    });
  }

  /**
   * Crear una meta de ahorro
   */
  async createGoal(userId: string, data: {
    name: string;
    target_amount: number;
    target_date?: Date;
    account_id?: string;
    category?: string;
  }): Promise<SavingsGoal> {
    // Si se vincula una cuenta, verificar propiedad
    if (data.account_id) {
      const account = await Account.findOne({ where: { id: data.account_id, user_id: userId } });
      if (!account) {
        throw new Error("La cuenta especificada no pertenece al usuario o no existe");
      }
    }

    return SavingsGoal.create({
      user_id: userId,
      ...data,
      current_amount: 0,
      status: "ACTIVE",
    });
  }

  /**
   * Actualizar una meta de ahorro
   */
  async updateGoal(userId: string, goalId: string, data: {
    name?: string;
    target_amount?: number;
    target_date?: Date;
    account_id?: string | null;
    status?: "ACTIVE" | "COMPLETED" | "PAUSED";
    category?: string;
  }): Promise<SavingsGoal> {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, user_id: userId } });
    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    if (data.account_id) {
      const account = await Account.findOne({ where: { id: data.account_id, user_id: userId } });
      if (!account) {
        throw new Error("La cuenta especificada no pertenece al usuario o no existe");
      }
    }

    await goal.update(data);
    return goal;
  }

  /**
   * Eliminar una meta de ahorro
   * IMPORTANTE: Si la meta tiene un monto ahorrado, debemos liberar el saldo reservado de la cuenta vinculada.
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const goal = await SavingsGoal.findOne({
      where: { id: goalId, user_id: userId },
      include: [Account],
    });

    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Si hay monto acumulado y tiene cuenta vinculada, liberamos el dinero reservado
      if (goal.current_amount > 0 && goal.account_id && goal.account) {
        const account = goal.account;
        const newReserved = Math.max(0, Number(account.reserved_balance) - Number(goal.current_amount));
        await account.update({ reserved_balance: newReserved }, { transaction });

        // Crear una transacción para registrar la liberación del dinero
        await Transaction.create({
          user_id: userId,
          account_id: goal.account_id,
          amount: Number(goal.current_amount),
          type: "SAVINGS_RELEASE",
          date: new Date(),
          description: `Liberación de saldo reservado por eliminación de la meta: ${goal.name}`,
        }, { transaction });
      }

      // 2. Sincronizar con el presupuesto (eliminar la categoría del presupuesto actual)
      const categoryName = `Ahorro: ${goal.name}`;
      const category = await Category.findOne({
        where: { name: categoryName, user_id: userId }
      });

      if (category) {
        // Obtener el presupuesto del mes actual (YYYY-MM)
        const currentPeriod = new Date().toISOString().substring(0, 7);
        const currentBudget = await Budget.findOne({
          where: { user_id: userId, period: currentPeriod }
        });

        if (currentBudget) {
          // Eliminar la asignación de este bolsillo en el presupuesto actual si existe
          await BudgetCategory.destroy({
            where: {
              budget_id: currentBudget.id,
              category_id: category.id
            },
            transaction
          });
        }

        // 3. Decidir si eliminar la Categoría o mantenerla para proteger el historial
        // Contamos cuántas transacciones o asignaciones presupuestarias históricas usan esta categoría
        const transactionCount = await Transaction.count({
          where: { category_id: category.id }
        });

        const budgetUsageCount = await BudgetCategory.count({
          where: { category_id: category.id }
        });

        // Si no se usa en transacciones y el conteo de presupuesto es <= 1 (solo el del mes actual que borramos o ninguno)
        if (transactionCount === 0 && budgetUsageCount <= 1) {
          // Primero borramos cualquier asignación restante de presupuesto
          await BudgetCategory.destroy({
            where: { category_id: category.id },
            transaction
          });
          // Se puede borrar físicamente la categoría sin romper el historial
          await Category.destroy({
            where: { id: category.id },
            transaction
          });
        }
      }

      // 4. Eliminar la meta
      await goal.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Aportar dinero manualmente a una meta de ahorro
   */
  async contributeToGoal(
    userId: string,
    goalId: string,
    amount: number,
    sourceAccountId?: string
  ): Promise<SavingsGoal> {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, user_id: userId } });
    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    // Usar la cuenta del aporte o por defecto la cuenta vinculada de la meta
    const accountId = sourceAccountId || goal.account_id;
    if (!accountId) {
      throw new Error("Se requiere una cuenta origen para realizar el aporte");
    }

    const account = await Account.findOne({ where: { id: accountId, user_id: userId } });
    if (!account) {
      throw new Error("La cuenta origen no existe o no pertenece al usuario");
    }

    // Verificar saldo disponible en la cuenta
    const availableBalance = Number(account.balance) - Number(account.reserved_balance);
    if (availableBalance < amount) {
      throw new Error("Saldo disponible insuficiente en la cuenta de origen");
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Bloquear dinero en la cuenta
      await account.update(
        { reserved_balance: Number(account.reserved_balance) + amount },
        { transaction }
      );

      // 2. Incrementar lo ahorrado en la meta
      const newCurrentAmount = Number(goal.current_amount) + amount;
      const isCompleted = newCurrentAmount >= Number(goal.target_amount);
      await goal.update(
        {
          current_amount: newCurrentAmount,
          status: isCompleted ? "COMPLETED" : goal.status,
        },
        { transaction }
      );

      // 3. Crear registro de transacción
      await Transaction.create({
        user_id: userId,
        account_id: account.id,
        savings_goal_id: goal.id,
        amount: -amount, // Negativo ya que sale del dinero disponible para gastar
        type: "SAVINGS_DEPOSIT",
        date: new Date(),
        description: `Aporte a bolsillo virtual: ${goal.name}`,
      }, { transaction });

      await transaction.commit();
      return goal;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Retirar dinero de una meta de ahorro
   */
  async withdrawFromGoal(
    userId: string,
    goalId: string,
    amount: number,
    targetAccountId?: string
  ): Promise<SavingsGoal> {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, user_id: userId } });
    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    if (Number(goal.current_amount) < amount) {
      throw new Error("Fondos insuficientes acumulados en esta meta de ahorro");
    }

    const accountId = targetAccountId || goal.account_id;
    if (!accountId) {
      throw new Error("Se requiere una cuenta de destino para el retiro");
    }

    const account = await Account.findOne({ where: { id: accountId, user_id: userId } });
    if (!account) {
      throw new Error("La cuenta destino no existe o no pertenece al usuario");
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Liberar saldo de reserved_balance en la cuenta destino
      // Nota: Si la cuenta destino es diferente a la original, liberamos el reserved_balance
      // de la cuenta original de la meta y ajustamos balances. Para simplificar,
      // asumimos que el dinero de la reserva se libera de la cuenta asociada.
      const reserveAccount = goal.account_id
        ? await Account.findOne({ where: { id: goal.account_id, user_id: userId } })
        : account;

      if (reserveAccount) {
        const newReserved = Math.max(0, Number(reserveAccount.reserved_balance) - amount);
        await reserveAccount.update({ reserved_balance: newReserved }, { transaction });
      }

      // 2. Decrementar lo acumulado en la meta
      const newCurrentAmount = Math.max(0, Number(goal.current_amount) - amount);
      await goal.update(
        {
          current_amount: newCurrentAmount,
          status: newCurrentAmount < Number(goal.target_amount) ? "ACTIVE" : goal.status,
        },
        { transaction }
      );

      // 3. Crear registro de transacción (positivo ya que vuelve al disponible)
      await Transaction.create({
        user_id: userId,
        account_id: account.id,
        savings_goal_id: goal.id,
        amount: amount,
        type: "SAVINGS_WITHDRAWAL",
        date: new Date(),
        description: `Retiro de bolsillo virtual: ${goal.name}`,
      }, { transaction });

      await transaction.commit();
      return goal;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtener proyecciones y simulaciones para una meta
   */
  async getGoalProjections(userId: string, goalId: string) {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, user_id: userId } });
    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    const schedules = await SavingsSchedule.findAll({
      where: { savings_goal_id: goalId, status: "ACTIVE" },
    });

    // Calcular la tasa de ahorro mensual agregada de las programaciones
    let monthlyRate = 0;
    for (const schedule of schedules) {
      const amount = Number(schedule.amount);
      if (schedule.frequency === "DAILY") {
        monthlyRate += amount * 30;
      } else if (schedule.frequency === "WEEKLY") {
        monthlyRate += amount * 4.33;
      } else if (schedule.frequency === "BIWEEKLY") {
        monthlyRate += amount * 2.16;
      } else if (schedule.frequency === "MONTHLY") {
        monthlyRate += amount;
      }
    }

    const target = Number(goal.target_amount);
    const current = Number(goal.current_amount);
    const remaining = Math.max(0, target - current);

    let estimatedCompletionDate: string | null = null;
    let monthsToComplete = 0;

    if (remaining > 0 && monthlyRate > 0) {
      monthsToComplete = remaining / monthlyRate;
      const daysToComplete = Math.round(monthsToComplete * 30);
      estimatedCompletionDate = addDays(new Date(), daysToComplete).toISOString().split("T")[0];
    }

    // Generar puntos de proyección mensual para gráfico
    const projectionPoints = [];
    let projectedAmount = current;
    let currentDate = new Date();

    // Añadir punto inicial
    projectionPoints.push({
      date: currentDate.toISOString().split("T")[0],
      projected_amount: Math.round(projectedAmount * 100) / 100,
    });

    if (remaining > 0 && monthlyRate > 0) {
      // Proyectar mes a mes hasta un máximo de 36 meses o alcanzar meta
      for (let i = 1; i <= 36; i++) {
        currentDate = addMonths(currentDate, 1);
        projectedAmount += monthlyRate;
        
        projectionPoints.push({
          date: currentDate.toISOString().split("T")[0],
          projected_amount: Math.round(Math.min(projectedAmount, target) * 100) / 100,
        });

        if (projectedAmount >= target) {
          break;
        }
      }
    }

    return {
      goal_name: goal.name,
      target_amount: target,
      current_amount: current,
      monthly_saving_rate: Math.round(monthlyRate * 100) / 100,
      estimated_completion_date: estimatedCompletionDate,
      projection_points: projectionPoints,
    };
  }

  /**
   * Crear una programación de ahorro automático
   */
  async createSchedule(userId: string, data: {
    savings_goal_id: string;
    source_account_id: string;
    amount: number;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    day_of_week?: number;
    day_of_month?: number;
  }): Promise<SavingsSchedule> {
    const goal = await SavingsGoal.findOne({ where: { id: data.savings_goal_id, user_id: userId } });
    if (!goal) {
      throw new Error("La meta de ahorro no existe o no pertenece al usuario");
    }

    const account = await Account.findOne({ where: { id: data.source_account_id, user_id: userId } });
    if (!account) {
      throw new Error("La cuenta origen no existe o no pertenece al usuario");
    }

    // Calcular la primera fecha de ejecución
    const nextRun = this.calculateNextRunDate(
      new Date(),
      data.frequency,
      data.day_of_week,
      data.day_of_month
    );

    return SavingsSchedule.create({
      ...data,
      next_run_date: nextRun,
      status: "ACTIVE",
    });
  }

  /**
   * Obtener todas las programaciones del usuario
   */
  async getSchedules(userId: string): Promise<SavingsSchedule[]> {
    return SavingsSchedule.findAll({
      include: [
        {
          model: SavingsGoal,
          where: { user_id: userId },
          attributes: ["id", "name"],
        },
        {
          model: Account,
          as: "sourceAccount",
          attributes: ["id", "name", "balance"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Eliminar programación
   */
  async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    const schedule = await SavingsSchedule.findOne({
      where: { id: scheduleId },
      include: [
        {
          model: SavingsGoal,
          where: { user_id: userId },
        },
      ],
    });

    if (!schedule) {
      throw new Error("Programación no encontrada o no pertenece al usuario");
    }

    await schedule.destroy();
  }

  /**
   * Procesar todas las programaciones activas que ya vencieron
   */
  async processDueSchedules(): Promise<{ processed: number; failed: number }> {
    const now = new Date();
    
    // Buscar programaciones activas que deben ejecutarse hoy o antes
    const dueSchedules = await SavingsSchedule.findAll({
      where: {
        status: "ACTIVE",
      },
      include: [
        {
          model: SavingsGoal,
        },
        {
          model: Account,
          as: "sourceAccount",
        },
      ],
    });

    let processed = 0;
    let failed = 0;

    for (const schedule of dueSchedules) {
      // Filtrar manualmente por fecha para evitar problemas de zonas horarias en queries SQL complejas
      if (isAfter(new Date(schedule.next_run_date), now)) {
        continue;
      }

      const goal = schedule.goal;
      const account = schedule.sourceAccount;

      if (!goal || !account) {
        failed++;
        continue;
      }

      // Validar si tiene balance disponible
      const available = Number(account.balance) - Number(account.reserved_balance);
      const amount = Number(schedule.amount);

      if (available >= amount) {
        try {
          // Ejecutar aporte usando la lógica existente (con su propia BD transaction)
          await this.contributeToGoal(goal.user_id, goal.id, amount, account.id);

          // Calcular siguiente fecha
          const nextRun = this.calculateNextRunDate(
            new Date(schedule.next_run_date),
            schedule.frequency,
            schedule.day_of_week,
            schedule.day_of_month
          );

          await schedule.update({ next_run_date: nextRun });
          processed++;
          console.log(`✅ Ahorro programado procesado para meta [${goal.name}]: $${amount}`);
        } catch (err) {
          console.error(`❌ Error al procesar transacción de ahorro programado id ${schedule.id}:`, err);
          failed++;
        }
      } else {
        console.warn(`⚠️ Saldo insuficiente para ahorro programado id ${schedule.id} en cuenta ${account.name}`);
        // Mover la fecha de ejecución al siguiente periodo para evitar bloqueos
        const nextRun = this.calculateNextRunDate(
          new Date(schedule.next_run_date),
          schedule.frequency,
          schedule.day_of_week,
          schedule.day_of_month
        );
        await schedule.update({ next_run_date: nextRun });
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Helper para calcular la siguiente fecha de ejecución
   */
  private calculateNextRunDate(
    current: Date,
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    let nextDate = new Date(current);

    switch (frequency) {
      case "DAILY":
        nextDate = addDays(nextDate, 1);
        break;
      case "WEEKLY":
        nextDate = addWeeks(nextDate, 1);
        if (dayOfWeek !== undefined) {
          // Ajustar al día de la semana configurado (1 Lunes, 7 Domingo)
          const currentDay = nextDate.getDay() === 0 ? 7 : nextDate.getDay();
          const diff = dayOfWeek - currentDay;
          nextDate = addDays(nextDate, diff);
        }
        break;
      case "BIWEEKLY":
        nextDate = addDays(nextDate, 14);
        break;
      case "MONTHLY":
        nextDate = addMonths(nextDate, 1);
        if (dayOfMonth !== undefined) {
          // Ajustar al día del mes configurado
          nextDate.setDate(Math.min(dayOfMonth, 28)); // Asegurar compatibilidad con febrero
        }
        break;
    }

    return nextDate;
  }

  /**
   * Sincronizar cuota de ahorro de una meta con un presupuesto mensual
   */
  async syncGoalWithBudget(
    userId: string,
    goalId: string,
    period: string,
    amount: number,
    categoryId?: string
  ): Promise<BudgetCategory> {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, user_id: userId } });
    if (!goal) {
      throw new Error("Meta de ahorro no encontrada");
    }

    // 1. Buscar o crear el presupuesto para el periodo
    let budget = await Budget.findOne({ where: { user_id: userId, period } });
    if (!budget) {
      budget = await Budget.create({
        user_id: userId,
        period,
        status: "DRAFT",
        planned_income: 0,
      });
    }

    // 2. Determinar la categoría (si no se envía, buscar/crear una llamada "Ahorro: [Goal Name]")
    let categoryIdToUse = categoryId;
    if (!categoryIdToUse) {
      const categoryName = `Ahorro: ${goal.name}`;
      let category = await Category.findOne({
        where: {
          name: categoryName,
          user_id: userId,
        },
      });
      if (!category) {
        category = await Category.create({
          name: categoryName,
          user_id: userId,
        });
      }
      categoryIdToUse = category.id;
    }

    // 3. Crear o actualizar la asignación de categoría en el presupuesto
    let budgetCategory = await BudgetCategory.findOne({
      where: {
        budget_id: budget.id,
        category_id: categoryIdToUse,
      },
    });

    if (amount > 0) {
      if (budgetCategory) {
        // Establecemos el monto exacto de la cuota en lugar de acumular sumas
        await budgetCategory.update({
          allocated_amount: amount,
        });
      } else {
        budgetCategory = await BudgetCategory.create({
          budget_id: budget.id,
          category_id: categoryIdToUse,
          allocated_amount: amount,
          original_allocated_amount: amount,
        });
      }
    } else {
      // Si el monto es 0 o menor, desvinculamos/eliminamos la categoría del presupuesto
      if (budgetCategory) {
        await budgetCategory.destroy();
      }
    }

    return budgetCategory || ({} as BudgetCategory);
  }
}
