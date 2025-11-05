import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../database/models/user';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  // Generar Access Token (corta duración)
  static generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    } as SignOptions);
  }

  // Generar Refresh Token (larga duración)
  static generateRefreshToken(payload: TokenPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    } as SignOptions);
  }

  // Generar ambos tokens
  static generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  // Verificar Access Token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Verificar Refresh Token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Login: verificar credenciales
  static async login(email: string, password: string): Promise<LoginResponse | null> {
    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Generar tokens
    const tokens = this.generateTokens(user);

    // Remover password del usuario
    const { password: _, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      tokens
    };
  }

  // Refresh: renovar Access Token
  static async refresh(refreshToken: string): Promise<AuthTokens> {
    // Verificar Refresh Token
    const payload = this.verifyRefreshToken(refreshToken);

    // Buscar usuario (verificar que aún existe)
    const user = await User.findByPk(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generar nuevos tokens
    return this.generateTokens(user);
  }
}
