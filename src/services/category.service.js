"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const models_1 = require("../database/models");
const models_2 = require("../database/models");
class CategoryService {
    static async getCategoriesByUserId(userId) {
        return await models_1.Category.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: models_2.User,
                    attributes: ["id", "name", "email"],
                },
            ],
        });
    }
    static async getCategoryById(categoryId, userId) {
        return await models_1.Category.findOne({
            where: { id: categoryId, user_id: userId },
            include: [
                {
                    model: models_2.User,
                    attributes: ["id", "name", "email"],
                },
            ],
        });
    }
    //Crear categoria nueva
    static async createCategory(categoryData) {
        //Verificar que el usuario existe
        const user = await models_2.User.findByPk(categoryData.user_id);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        //Crear la categoria
        const categoryToCreate = {
            name: categoryData.name,
            user_id: categoryData.user_id,
        };
        return await models_1.Category.create(categoryToCreate);
    }
    static async updateCategory(categoryId, userId, updateData) {
        // Buscar la categoria y verificar que pertenece al usuario
        const category = await models_1.Category.findOne({
            where: {
                id: categoryId,
                user_id: userId
            },
        });
        if (!category) {
            throw new Error("Categoria no encontrada o no autorizada");
        }
        //Actualizar la categoria
        await category.update(updateData);
        return category;
    }
    //Eliminar Categoria
    static async deleteCategory(categoryId, userId) {
        const category = await models_1.Category.findOne({
            where: {
                id: categoryId,
                user_id: userId,
            },
        });
        if (!category) {
            throw new Error("Categoria no encontrada o no autorizada");
        }
        await category.destroy();
        return { message: "Categoria eliminada exitosamente" };
    }
}
exports.CategoryService = CategoryService;
