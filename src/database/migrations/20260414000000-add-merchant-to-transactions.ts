import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    const tableDescription = await queryInterface.describeTable('transactions');
    if (!tableDescription['merchant']) {
      await queryInterface.addColumn('transactions', 'merchant', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
  },
  async down(queryInterface: QueryInterface) {
    const tableDescription = await queryInterface.describeTable('transactions');
    if (tableDescription['merchant']) {
      await queryInterface.removeColumn('transactions', 'merchant');
    }
  },
};
