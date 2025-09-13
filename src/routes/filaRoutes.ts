import { Router } from 'express';
import { withClient } from '../config/db.js';
import { processEmailQueue } from '../services/emailService.js';

export const filaRouter = Router();

// Listar fila de emails
filaRouter.get('/', async (_req, res) => {
  const { rows } = await withClient(c =>
    c.query('SELECT * FROM notification_service.filas_email ORDER BY data_envio DESC LIMIT 50')
  );
  res.json(rows);
});

// Reenviar email com erro
filaRouter.post('/:id/retry', async (req, res) => {
  const id = req.params.id;
  await withClient(c => c.query(
    `UPDATE notification_service.filas_email SET status='PENDENTE' WHERE id=$1 AND status='ERRO'`,
    [id]
  ));
  await processEmailQueue();
  res.json({ ok: true });
});
