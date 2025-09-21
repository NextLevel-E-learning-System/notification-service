import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';

export const filaRouter = Router();

// GET /api/v1/email/queue - Listar fila de emails
filaRouter.get('/', EmailController.getEmailQueue);

// POST /api/v1/email/queue/:id/retry - Retentar envio de email
filaRouter.post('/:id/retry', EmailController.retryEmail);

// POST /api/v1/email/queue/process - Processar fila manualmente
filaRouter.post('/process', EmailController.processQueue);

// GET /api/v1/email/queue/stats - Estatísticas da fila
filaRouter.get('/stats', EmailController.getQueueStats);
