import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('transactions', 'merchant', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('transactions', 'merchant');
  },
};
