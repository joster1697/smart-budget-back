import { Router, Request } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
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

// POST /api/agent/ingest/text
router.post('/ingest/text', authenticate, ingestText);

// POST /api/agent/ingest/audio
router.post('/ingest/audio', authenticate, upload.single('audio'), ingestAudio);

export default router;
