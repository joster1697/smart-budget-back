"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    async up(queryInterface) {
        await queryInterface.createTable('transactions', {
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
                type: sequelize_1.DataTypes.UUID
            },
            account_id: {
                references: {
                    model: 'accounts',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                type: sequelize_1.DataTypes.UUID,
                allowNull: true
            },
            category_id: {
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                type: sequelize_1.DataTypes.UUID,
                allowNull: true
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL,
                allowNull: true
            },
            type: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true
            },
            date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            description: {
                type: sequelize_1.DataTypes.STRING,
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
        await queryInterface.dropTable('transactions');
    }
};
