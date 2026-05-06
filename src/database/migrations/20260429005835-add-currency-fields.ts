"use strict";

import { QueryInterface, DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("users", "base_currency", {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "CRC",
    });

    await queryInterface.addColumn("transactions", "original_currency", {
      type: DataTypes.STRING(3),
      allowNull: true,
    });

    await queryInterface.addColumn("transactions", "original_amount", {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("transactions", "exchange_rate", {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("transactions", "exchange_rate");
    await queryInterface.removeColumn("transactions", "original_amount");
    await queryInterface.removeColumn("transactions", "original_currency");
    await queryInterface.removeColumn("users", "base_currency");
  },
};
