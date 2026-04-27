import { NextFunction, Response } from "express";
import { CategoryService } from "../services/category.service";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Obtener todas las categorias del usuario autenticado
 * @route GET /api/categories
 * @access Private
 */

export const getUserCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const categories = await CategoryService.getCategoriesByUserId(userId);
    res.status(200).json({
      message: "Categorias obtenidas exitosamente",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una categoria específica por ID
 * @route GET /api/categories/:id
 * @access Private
 */

export const getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    const category = await CategoryService.getCategoryById(id, userId);

    if (!category) {
      return res.status(404).json({
        message: "Categoria no encontrada",
      });
    }

    res.status(200).json({
      message: "Categoria obtenida exitosamente",
      category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva categoria
 * @route POST /api/categories
 * @access Private
 */

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { name } = req.body;
    const categoryData = {
      user_id: userId,
      name: name,
    };
    const newCategory = await CategoryService.createCategory(categoryData);

    res.status(201).json({
      message: "Categoria creada exitosamente",
      category: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una categoria existente
 * @route PUT /api/categories/:id
 * @access Private
 */

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { name } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;

    const updatedCategory = await CategoryService.updateCategory(
      id,
      userId,
      updateData,
    );

    res.status(200).json({
      message: "Categoria actualizada exitosamente",
      category: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una categoria
 * @route DELETE /api/categories/:id
 * @access Private
 */

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const result = CategoryService.deleteCategory(id, userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
