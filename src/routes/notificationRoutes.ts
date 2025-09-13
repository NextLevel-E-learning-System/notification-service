import { Router } from 'express';
import { withClient } from '../config/db.js';

export const notificationRouter = Router();

// Listar notificações por usuário
notificationRouter.get('/:usuarioId', async (req, res) => {
  const usuarioId = req.params.usuarioId;
  const { rows } = await withClient(c =>
    c.query(
      'SELECT * FROM notification_service.notificacoes WHERE usuario_id=$1 ORDER BY data_criacao DESC',
      [usuarioId]
    )
  );
  res.json(rows);
});
