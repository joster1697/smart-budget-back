import { QueryInterface, QueryTypes } from 'sequelize';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { v4: uuidv4 } = require('uuid') as { v4: () => string };

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

module.exports = {
  async up(queryInterface: QueryInterface) {
    // Eliminar las categorías globales (user_id IS NULL).
    // Primero debemos eliminar las referencias en budget_categories para evitar errores de FK.
    await queryInterface.sequelize.query(
      'DELETE FROM budget_categories WHERE category_id IN (SELECT id FROM categories WHERE user_id IS NULL)'
    );
    
    await queryInterface.bulkDelete('categories', { user_id: null } as any);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('categories', { user_id: null } as any);
  },
};
