import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("transactions", "savings_goal_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "savings_goals",
        key: "id",
      },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("transactions", "savings_goal_id");
  },
};
