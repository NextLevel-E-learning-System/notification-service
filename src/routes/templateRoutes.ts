import { Router } from 'express';
import { withClient } from '../config/db.js';

export const templateRouter = Router();

templateRouter.get('/', async (_req, res) => {
  const { rows } = await withClient(c =>
    c.query('SELECT * FROM notification_service.templates ORDER BY criado_em DESC')
  );
  res.json(rows);
});

templateRouter.post('/', async (req, res) => {
  const { codigo, titulo, corpo, variaveis } = req.body;
  await withClient(c =>
    c.query(
      `INSERT INTO notification_service.templates (codigo, titulo, corpo, variaveis)
       VALUES ($1,$2,$3,$4) ON CONFLICT(codigo) DO NOTHING`,
      [codigo, titulo, corpo, variaveis || []]
    )
  );
  res.status(201).json({ ok: true });
});
