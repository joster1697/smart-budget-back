import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('accounts', 'name', {
      allowNull: false,
      type: DataTypes.STRING,
      after: 'user_id',
    } as any);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('accounts', 'name');
  },
};
