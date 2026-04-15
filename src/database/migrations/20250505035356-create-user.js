"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    async up(queryInterface) {
        await queryInterface.createTable('users', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            email: {
                unique: true,
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
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
        await queryInterface.dropTable('users');
    }
};
