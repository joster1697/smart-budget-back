import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('debts', 'sync_budget', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('debts', 'planned_extra_payment', {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('debts', 'sync_budget');
    await queryInterface.removeColumn('debts', 'planned_extra_payment');
  }
};
