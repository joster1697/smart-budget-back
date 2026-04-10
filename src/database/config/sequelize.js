"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
// config/database.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = require("../models/user");
const account_1 = require("../models/account");
const transaction_1 = require("../models/transaction");
const budget_1 = require("../models/budget");
const category_1 = require("../models/category");
dotenv_1.default.config();
const sequelize = new sequelize_typescript_1.Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}
});
// Agregar modelos manualmente después de crear la instancia
sequelize.addModels([user_1.User, account_1.Account, transaction_1.Transaction, budget_1.Budget, category_1.Category]);
// Función para inicializar la conexión
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida');
        // Sincronización solo en desarrollo (usar migraciones en producción)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Modelos sincronizados');
        }
    }
    catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Termina la aplicación si no puede conectarse
    }
}
exports.default = sequelize;
