import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Registrar un nuevo usuario
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado'
      });
    }

    const user = await UserService.createUser({
      name,
      email,
      password
    });

    const tokens = AuthService.generateTokens(user);

    // Remover el password de la respuesta
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Iniciar sesión de un usuario
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Intentar hacer login
    const result = await AuthService.login(email, password);

    if (!result) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    res.status(200).json({
      message: 'Login exitoso',
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renovar tokens de un usuario
 * @route POST /api/auth/refresh
 * @access Public
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    // Intentar renovar los tokens
    const tokens = await AuthService.refresh(refreshToken);

    if (!tokens) {
      return res.status(401).json({
        message: 'Refresh token inválido o expirado'
      });
    }

    res.status(200).json({
      message: 'Tokens renovados exitosamente',
      tokens
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Logout (opcional - depende de si quieres implementar blacklist de tokens)
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // En una implementación completa, aquí podrías:
    // 1. Agregar el token a una blacklist en Redis
    // 2. Eliminar refresh tokens de la base de datos
    // 3. Invalidar sesiones activas
    
    // Por ahora, solo retornamos un mensaje de éxito
    // El cliente debe eliminar los tokens del localStorage
    
    res.status(200).json({
      message: 'Logout exitoso. Por favor, elimina los tokens del cliente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener información del usuario autenticado
 * @route GET /api/auth/me
 * @access Private
 */
export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'No autenticado'
      });
    }

    const user = await UserService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Remover el password de la respuesta
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(200).json({
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};
