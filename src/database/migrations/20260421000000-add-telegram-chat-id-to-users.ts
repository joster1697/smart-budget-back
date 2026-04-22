import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.addColumn('users', 'telegram_chat_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('users', 'telegram_chat_id');
  },
};