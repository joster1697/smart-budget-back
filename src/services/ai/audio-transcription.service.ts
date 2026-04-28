import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  'audio/ogg': 'audio/ogg',
  'audio/opus': 'audio/ogg',
  'audio/mp4': 'audio/mp4',
  'audio/mpeg': 'audio/mpeg',
  'audio/webm': 'audio/webm',
  'audio/wav': 'audio/wav',
};

export class AudioTranscriptionService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }
    return new GoogleGenerativeAI(apiKey);
  }

  static async transcribe(buffer: Buffer, mimeType: string): Promise<string> {
    const resolvedMime = SUPPORTED_AUDIO_TYPES[mimeType];
    if (!resolvedMime) {
      throw new Error(
        `Tipo de audio no soportado: ${mimeType}. Tipos soportados: ${Object.keys(SUPPORTED_AUDIO_TYPES).join(', ')}`
      );
    }

    const client = this.getClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    const model = client.getGenerativeModel({ model: modelName });

    const audioBase64 = buffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: resolvedMime,
          data: audioBase64,
        },
      },
      {
        text: 'Transcribe exactamente lo que dice esta nota de audio. Devuelve únicamente el texto transcrito, sin explicaciones ni formato adicional.',
      },
    ]);

    const transcription = result.response.text().trim();
    if (!transcription) {
      throw new Error('No se pudo transcribir el audio: la respuesta de la IA está vacía');
    }

    return transcription;
  }
}
