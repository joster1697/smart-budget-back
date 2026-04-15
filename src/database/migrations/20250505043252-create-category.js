"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    async up(queryInterface) {
        await queryInterface.createTable('categories', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true
            },
            user_id: {
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                type: sequelize_1.DataTypes.UUID,
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
        await queryInterface.dropTable('categories');
    }
};
