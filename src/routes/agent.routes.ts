import { Router, Request } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ingestTextSchema } from '../validators/agent.validators';
import { ingestText, ingestAudio } from '../controllers/agent.controller';

const router = Router();

// Multer en memoria — solo para audio, límite 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio'));
    }
  },
});

/**
 * @openapi
 * /api/agent/ingest/text:
 *   post:
 *     tags:
 *       - Agent
 *     summary: Procesar un comando de texto en lenguaje natural
 *     description: |
 *       Envía una instrucción financiera en lenguaje natural al agente de IA.
 *       El sistema parsea la intención, extrae entidades y ejecuta la acción o
 *       solicita confirmación/aclaración cuando es necesario.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input]
 *             properties:
 *               input:
 *                 type: string
 *                 minLength: 1
 *                 example: 'Gasté ₡5000 en almuerzo hoy'
 *     responses:
 *       '200':
 *         description: Resultado del procesamiento del agente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Respuesta en lenguaje natural del agente
 *                 actions:
 *                   type: array
 *                   description: Acciones ejecutadas o pendientes
 *                   items:
 *                     type: object
 *       '400':
 *         description: Input vacío o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/ingest/text', authenticate, validate(ingestTextSchema), ingestText);

/**
 * @openapi
 * /api/agent/ingest/audio:
 *   post:
 *     tags:
 *       - Agent
 *     summary: Procesar un comando de voz (audio)
 *     description: |
 *       Sube un archivo de audio con una instrucción financiera.
 *       El sistema transcribe el audio y lo procesa igual que un comando de texto.
 *       Formatos soportados: audio/* (mp3, wav, ogg, m4a, etc). Límite: 10MB.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [audio]
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de audio (máx. 10MB)
 *     responses:
 *       '200':
 *         description: Resultado del procesamiento del agente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: object
 *       '400':
 *         description: Archivo inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/ingest/audio', authenticate, upload.single('audio'), ingestAudio);

export default router;
