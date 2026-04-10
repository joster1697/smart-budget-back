"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (requiere autenticación)
 * @access  Private
 */
router.get("/", auth_middleware_1.authenticate, user_controller_1.getUsers);
router.get("/:id", auth_middleware_1.authenticate, user_controller_1.getUserById);
// Futuras rutas:
// router.put("/:id", authenticate, updateUser);
// router.delete("/:id", authenticate, authorize("admin"), deleteUser);
exports.default = router;
