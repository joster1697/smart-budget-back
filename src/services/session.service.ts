import Redis from 'ioredis';
import { ResolvedAction } from './channel-processor';

// Inicializar el cliente de Redis si REDIS_URL está presente
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Fallback a Map en memoria si no hay Redis (útil para desarrollo local rápido)
const memorySessions = new Map<string, { data: ResolvedAction[], expiresAt: number }>();

export class SessionService {
  /**
   * Guarda las acciones pendientes para una sesión
   * @param chatId ID del chat
   * @param actions Lista de acciones resueltas
   * @param ttlSeconds Tiempo de vida en segundos (por defecto 300s = 5 min)
   */
  static async set(chatId: string, actions: ResolvedAction[], ttlSeconds: number = 300): Promise<void> {
    if (redisClient) {
      await redisClient.set(`session:${chatId}`, JSON.stringify(actions), 'EX', ttlSeconds);
    } else {
      memorySessions.set(chatId, {
        data: actions,
        expiresAt: Date.now() + ttlSeconds * 1000
      });
    }
  }

  /**
   * Obtiene las acciones pendientes para una sesión
   * @param chatId ID del chat
   * @returns Lista de acciones resueltas o nulo si no existe/expiró
   */
  static async get(chatId: string): Promise<ResolvedAction[] | null> {
    if (redisClient) {
      const data = await redisClient.get(`session:${chatId}`);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    } else {
      const session = memorySessions.get(chatId);
      if (!session) return null;
      if (Date.now() > session.expiresAt) {
        memorySessions.delete(chatId);
        return null;
      }
      return session.data;
    }
  }

  /**
   * Elimina las acciones pendientes para una sesión
   * @param chatId ID del chat
   */
  static async delete(chatId: string): Promise<void> {
    if (redisClient) {
      await redisClient.del(`session:${chatId}`);
    } else {
      memorySessions.delete(chatId);
    }
  }
}
