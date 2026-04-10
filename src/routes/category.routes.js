"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const category_validators_1 = require("../validators/category.validators");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorias del usuario autenticado
 * @access  Private
 */
router.get("/", auth_middleware_1.authenticate, category_controller_1.getUserCategories);
/**
 * @route   GET /api/categories/:id
 * @desc    Obtener una categoria específica por ID
 * @access  Private
 */
router.get("/:id", auth_middleware_1.authenticate, category_controller_1.getCategoryById);
/**
 * @route   POST /api/category
 * @desc    Crear una nueva categoria
 * @access  Private
 */
router.post("/", auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(category_validators_1.createCategorySchema), category_controller_1.createCategory);
/**
 * @route   PUT /api/categories/:id
 * @desc    Actualizar una categoria existente
 * @access  Private
 */
router.put("/:id", auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(category_validators_1.updateCategorySchema), category_controller_1.updateCategory);
/**
 * @route   DELETE /api/categories/:id
 * @desc    Eliminar una categoria
 * @access  Private
 */
router.delete("/:id", auth_middleware_1.authenticate, category_controller_1.deleteCategory);
exports.default = router;
