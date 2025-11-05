import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

// Extender el tipo Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Middleware para verificar autenticación
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar formato: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verificar el token
    try {
      const payload = AuthService.verifyAccessToken(token);
      
      // Adjuntar la información del usuario al request
      req.user = {
        id: payload.userId,
        email: payload.email
      };

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido o expirado',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  } catch (error) {
    console.error('Error en middleware authenticate:', error);
    return res.status(500).json({
      message: 'Error al verificar autenticación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Middleware opcional para verificar roles (para futura implementación)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado'
      });
    }

    // Aquí puedes agregar lógica para verificar roles
    // Por ejemplo, si agregas un campo 'role' al usuario
    // const userRole = req.user.role;
    // if (!roles.includes(userRole)) {
    //   return res.status(403).json({
    //     message: 'No tienes permisos para realizar esta acción'
    //   });
    // }

    next();
  };
};
