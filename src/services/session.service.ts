import Redis from 'ioredis';
import { ResolvedAction } from './channel-processor';

// Inicializar el cliente de Redis si REDIS_URL está presente
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });
}

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
      try {
        await redisClient.set(`session:${chatId}`, JSON.stringify(actions), 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.error('[Redis] set failed, falling back to memory:', (err as Error).message);
      }
    }
    memorySessions.set(chatId, {
      data: actions,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Obtiene las acciones pendientes para una sesión
   * @param chatId ID del chat
   * @returns Lista de acciones resueltas o nulo si no existe/expiró
   */
  static async get(chatId: string): Promise<ResolvedAction[] | null> {
    if (redisClient) {
      try {
        const data = await redisClient.get(`session:${chatId}`);
        if (!data) return null;
        return JSON.parse(data);
      } catch (err) {
        console.error('[Redis] get failed, falling back to memory:', (err as Error).message);
      }
    }
    const session = memorySessions.get(chatId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      memorySessions.delete(chatId);
      return null;
    }
    return session.data;
  }

  /**
   * Elimina las acciones pendientes para una sesión
   * @param chatId ID del chat
   */
  static async delete(chatId: string): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.del(`session:${chatId}`);
        return;
      } catch (err) {
        console.error('[Redis] delete failed, falling back to memory:', (err as Error).message);
      }
    }
    memorySessions.delete(chatId);
  }
}
