import sequelize from '../config/sequelize';
import { User } from './user';
import { Account } from './account';
import { Transaction } from './transaction';
import { Budget } from './budget';
import { BudgetCategory } from './budget-category';
import { Category } from './category';

// Los modelos ya están registrados en sequelize a través de la opción 'models'
// en la configuración de Sequelize (sequelize.ts)

const models = {
  User,
  Account,
  Transaction,
  Category,
  Budget,
  BudgetCategory
};

export { sequelize, models };
export { User, Account, Transaction, Budget, BudgetCategory, Category };
