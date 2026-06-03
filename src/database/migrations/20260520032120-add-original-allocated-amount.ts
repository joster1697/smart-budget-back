import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('budget_categories', 'original_allocated_amount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('budget_categories', 'original_allocated_amount');
  },
};
