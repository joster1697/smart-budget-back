// eslint-disable-next-line @typescript-eslint/no-require-imports
const { v4: uuidv4 } = require('uuid') as { v4: () => string };
import dotenv from 'dotenv';
import sequelize from '../config/sequelize';
import { Category } from '../models/category';

dotenv.config();

const SYSTEM_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Hogar',
  'Ropa',
  'Suscripciones',
  'Viajes',
  'Servicios Públicos',
  'Otros',
];

async function seed() {
  await sequelize.authenticate();

  const existing = await Category.findAll({ where: { user_id: null as any } });
  const existingNames = new Set(existing.map((c) => c.name));

  const toInsert = SYSTEM_CATEGORIES
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ id: uuidv4(), name, user_id: undefined }));

  if (toInsert.length > 0) {
    await Category.bulkCreate(toInsert as any);
    console.log(`✅ ${toInsert.length} categorías del sistema insertadas.`);
  } else {
    console.log('ℹ️  Las categorías del sistema ya existen, no se insertó nada.');
  }

  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Error al ejecutar el seeder:', err);
  process.exit(1);
});
