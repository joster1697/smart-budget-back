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
    const existing = await queryInterface.sequelize.query<{ name: string }>(
      'SELECT name FROM categories WHERE user_id IS NULL',
      { type: QueryTypes.SELECT },
    );
    const existingNames = new Set(existing.map((r) => r.name));

    const toInsert = SYSTEM_CATEGORIES
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        id: uuidv4(),
        name,
        user_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('categories', toInsert);
    }
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('categories', { user_id: null } as any);
  },
};
