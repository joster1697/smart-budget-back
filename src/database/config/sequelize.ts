// config/database.ts
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { Account } from '../models/account';
import { Transaction } from '../models/transaction';
import { Budget } from '../models/budget';
import { Category } from '../models/category';

dotenv.config();

const sequelize = new Sequelize({
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
sequelize.addModels([User, Account, Transaction, Budget, Category]);

// Función para inicializar la conexión
export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida');
    
    // Sincronización solo en desarrollo (usar migraciones en producción)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados');
    }
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1); // Termina la aplicación si no puede conectarse
  }
}

export default sequelize;