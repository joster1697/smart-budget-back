import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { IngestionService } from '../services/ai/ingestion.service';
import { AudioTranscriptionService } from '../services/ai/audio-transcription.service';
import { CategoryService } from '../services/category.service';
import { resolveActions, ResolvedAction } from '../services/channel-processor';

async function processInput(
  userId: string,
  input: string,
  parsedFrom: 'text' | 'audio',
): Promise<ResolvedAction[]> {
  const categories = await CategoryService.getCategoriesByUserId(userId);
  const categoryContext = categories.map((c) => ({ id: c.id, name: c.name ?? '' }));
  const results = await IngestionService.parseFromText(input, categoryContext, parsedFrom);
  return resolveActions(userId, results);
}

export const ingestText = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

    const { input } = req.body as { input?: string };
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({ message: 'El campo "input" es requerido y no puede estar vacío' });
    }

    const actions = await processInput(userId, input.trim(), 'text');

    return res.status(200).json({
      message: 'Texto procesado exitosamente',
      actions,
    });
  } catch (error) {
    console.error('Error en ingestText:', error);
    return res.status(500).json({
      message: 'Error al procesar el texto',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

export const ingestAudio = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Se requiere un archivo de audio en el campo "audio"' });
    }

    const transcription = await AudioTranscriptionService.transcribe(file.buffer, file.mimetype);
    const actions = await processInput(userId, transcription, 'audio');

    return res.status(200).json({
      message: 'Audio procesado exitosamente',
      transcription,
      actions,
    });
  } catch (error) {
    console.error('Error en ingestAudio:', error);
    return res.status(500).json({
      message: 'Error al procesar el audio',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
