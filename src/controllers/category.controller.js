"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getUserCategories = void 0;
const category_service_1 = require("../services/category.service");
/**
 * Obtener todas las categorias del usuario autenticado
 * @route GET /api/categories
 * @access Private
 */
const getUserCategories = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }
        const categories = await category_service_1.CategoryService.getCategoriesByUserId(userId);
        res.status(200).json({
            message: "Categorias obtenidas exitosamente",
            categories,
        });
    }
    catch (error) {
        console.log("Error en getUserCategories:", error);
        res.status(500).json({
            message: "Error al obtener las categorias",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.getUserCategories = getUserCategories;
/**
 * Obtener una categoria específica por ID
 * @route GET /api/categories/:id
 * @access Private
 */
const getCategoryById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                message: "Usuario no autenticado",
            });
        }
        const category = await category_service_1.CategoryService.getCategoryById(id, userId);
        if (!category) {
            return res.status(404).json({
                message: "Categoria no encontrada",
            });
        }
        res.status(200).json({
            message: "Categoria obtenida exitosamente",
            category,
        });
    }
    catch (error) {
        console.log("Error en getCategoryById:", error);
        res.status(500).json({
            message: "Error al obtener la categoria",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.getCategoryById = getCategoryById;
/**
 * Crear una nueva categoria
 * @route POST /api/categories
 * @access Private
 */
const createCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }
        const { user_id, name } = req.body;
        const categoryData = {
            user_id: userId,
            name: name,
        };
        const newCategory = await category_service_1.CategoryService.createCategory(categoryData);
        res.status(201).json({
            message: "Categoria creada exitosamente",
            category: newCategory,
        });
    }
    catch (error) {
        console.error("Error en CreateCategory:", error);
        res.status(500).json({
            message: "Error al crear la categoria",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.createCategory = createCategory;
/**
 * Actualizar una categoria existente
 * @route PUT /api/categories/:id
 * @access Private
 */
const updateCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }
        const { name } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        const updatedCategory = await category_service_1.CategoryService.updateCategory(id, userId, updateData);
        res.status(200).json({
            message: "Categoria actualizada exitosamente",
            category: updatedCategory,
        });
    }
    catch (error) {
        console.error("Error en updateCategory", error);
        res.status(500).json({
            message: "Error al actualizar la categoria",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.updateCategory = updateCategory;
/**
 * Eliminar una categoria
 * @route DELETE /api/categories/:id
 * @access Private
 */
const deleteCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }
        const result = category_service_1.CategoryService.deleteCategory(id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error en deleteCategory", error);
        res.status(500).json({
            message: "Error al eliminar la categoria",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.deleteCategory = deleteCategory;
