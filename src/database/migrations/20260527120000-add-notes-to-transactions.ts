import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.addColumn("transactions", "notes", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    } catch (err: any) {
      if (err.message && err.message.includes("Duplicate column name")) {
        console.log("⚠️ Column 'notes' already exists in 'transactions', skipping...");
      } else {
        throw err;
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("transactions", "notes");
  },
};
