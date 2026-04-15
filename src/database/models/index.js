"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = exports.Budget = exports.Transaction = exports.Account = exports.User = exports.models = exports.sequelize = void 0;
const sequelize_1 = __importDefault(require("../config/sequelize"));
exports.sequelize = sequelize_1.default;
const user_1 = require("./user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
const account_1 = require("./account");
Object.defineProperty(exports, "Account", { enumerable: true, get: function () { return account_1.Account; } });
const transaction_1 = require("./transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transaction_1.Transaction; } });
const budget_1 = require("./budget");
Object.defineProperty(exports, "Budget", { enumerable: true, get: function () { return budget_1.Budget; } });
const category_1 = require("./category");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return category_1.Category; } });
// Los modelos ya están registrados en sequelize a través de la opción 'models'
// en la configuración de Sequelize (sequelize.ts)
const models = {
    User: user_1.User,
    Account: account_1.Account,
    Transaction: transaction_1.Transaction,
    Category: category_1.Category,
    Budget: budget_1.Budget
};
exports.models = models;
