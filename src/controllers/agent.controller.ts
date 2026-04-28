import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AudioTranscriptionService } from '../services/ai/audio-transcription.service';
import { processInput } from '../services/channel-processor';

export const ingestText = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

    const { input } = req.body as { input: string };

    const actions = await processInput(userId, input, 'text');

    return res.status(200).json({
      message: 'Texto procesado exitosamente',
      actions,
    });
  } catch (error) {
    next(error);
  }
};

export const ingestAudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    next(error);
  }
};
