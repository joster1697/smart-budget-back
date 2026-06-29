import sequelize from '../config/sequelize';
import { User } from './user';
import { Account } from './account';
import { Transaction } from './transaction';
import { Budget } from './budget';
import { BudgetCategory } from './budget-category';
import { Category } from './category';
import { Debt } from './debt';
import { SavingsGoal } from './savings-goal';
import { SavingsSchedule } from './savings-schedule';

// Los modelos ya están registrados en sequelize a través de la opción 'models'
// en la configuración de Sequelize (sequelize.ts)

const models = {
  User,
  Account,
  Transaction,
  Category,
  Budget,
  BudgetCategory,
  Debt,
  SavingsGoal,
  SavingsSchedule
};

export { sequelize, models };
export { User, Account, Transaction, Budget, BudgetCategory, Category, Debt, SavingsGoal, SavingsSchedule };

