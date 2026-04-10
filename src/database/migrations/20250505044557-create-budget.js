"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    async up(queryInterface) {
        await queryInterface.createTable('budgets', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4
            },
            user_id: {
                allowNull: false,
                type: sequelize_1.DataTypes.UUID
            },
            category_id: {
                allowNull: false,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                type: sequelize_1.DataTypes.UUID
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE
            },
            updatedAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE
            }
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('budgets');
    }
};
