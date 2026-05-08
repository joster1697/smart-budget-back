import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("accounts", "reserved_balance", {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryinterface: QueryInterface) => {
    await queryinterface.removeColumn("accounts", "reserved_balance");
  },
};
