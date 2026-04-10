"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    async up(queryInterface) {
        await queryInterface.createTable("accounts", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4
            },
            user_id: {
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                type: sequelize_1.DataTypes.UUID,
            },
            balance: {
                allowNull: false,
                type: sequelize_1.DataTypes.DECIMAL,
            },
            account_linked: {
                allowNull: true,
                references: {
                    model: 'accounts',
                    key: 'id'
                },
                type: sequelize_1.DataTypes.UUID
            },
            type: {
                allowNull: false,
                type: sequelize_1.DataTypes.STRING
            },
            createdAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("accounts");
    },
};
