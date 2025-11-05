import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

// Extender el tipo Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Registro de nuevo usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Todos los campos son requeridos (name, email, password)'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'El formato del email es inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado'
      });
    }

    // Crear el usuario
    const user = await UserService.createUser({
      name,
      email,
      password
    });

    // Generar tokens (pasamos el objeto User completo)
    const tokens = AuthService.generateTokens(user);

    // Remover el password de la respuesta
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      message: 'Error al registrar el usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email y contraseña son requeridos'
      });
    }

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
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error al iniciar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Refresh token
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Validar que el refreshToken esté presente
    if (!refreshToken) {
      return res.status(400).json({
        message: 'Refresh token es requerido'
      });
    }

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
    console.error('Error en refresh:', error);
    res.status(500).json({
      message: 'Error al renovar los tokens',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Logout (opcional - depende de si quieres implementar blacklist de tokens)
export const logout = async (req: Request, res: Response) => {
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
    console.error('Error en logout:', error);
    res.status(500).json({
      message: 'Error al cerrar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener información del usuario autenticado
export const me = async (req: AuthRequest, res: Response) => {
  try {
    // El middleware authenticate ya validó el token y adjuntó el usuario
    if (!req.user) {
      return res.status(401).json({
        message: 'No autenticado'
      });
    }

    // Obtener información completa del usuario
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
    console.error('Error en me:', error);
    res.status(500).json({
      message: 'Error al obtener información del usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
