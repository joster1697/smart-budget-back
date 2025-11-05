import { Router } from "express";
import { getUsers } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (requiere autenticación)
 * @access  Private
 */
router.get("/", authenticate, getUsers);

// Futuras rutas:
// router.get("/:id", authenticate, getUserById);
// router.put("/:id", authenticate, updateUser);
// router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;