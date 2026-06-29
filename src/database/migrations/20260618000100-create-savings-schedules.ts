import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("savings_schedules", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      savings_goal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "savings_goals",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      source_account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      frequency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      day_of_week: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      day_of_month: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      next_run_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("savings_schedules");
  },
};
