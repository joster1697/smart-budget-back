import { Router } from "express";
import {
  getUserCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validators";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorias del usuario autenticado
 * @access  Private
 */

router.get("/", authenticate, getUserCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Obtener una categoria específica por ID
 * @access  Private
 */

router.get("/:id", authenticate, getCategoryById);

/**
 * @route   POST /api/category
 * @desc    Crear una nueva categoria
 * @access  Private
 */

router.post("/", authenticate, validate(createCategorySchema), createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Actualizar una categoria existente
 * @access  Private
 */

router.put(
  "/:id",
  authenticate,
  validate(updateCategorySchema),
  updateCategory,
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Eliminar una categoria
 * @access  Private
 */

router.delete("/:id", authenticate, deleteCategory);

export default router;
