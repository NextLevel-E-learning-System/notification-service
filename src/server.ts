import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { startUserEventsConsumer } from './workers/userEventsConsumer.js';
import { withClient } from './db.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
interface Notificacao { id: string; usuario_id: string; titulo: string; mensagem: string; lida: boolean; data_criacao: string; canal?: string | null; tipo?: string | null; }

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: '*'}));
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }));

  app.get('/notifications/v1', async (req, res) => {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'missing_user_context' });
    try {
      const result = await withClient(c => c.query<Notificacao>('select id, usuario_id, titulo, mensagem, tipo, canal, lida, data_criacao from notificacoes where usuario_id=$1 order by data_criacao desc limit 100', [userId]));
      res.json(result.rows);
    } catch (err:any) {
      logger.error({ err }, 'list_notifications_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.post('/notifications/v1', async (req, res) => {
    const schema = z.object({ usuario_id: z.string().uuid(), titulo: z.string(), mensagem: z.string(), tipo: z.string().optional(), canal: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
    try {
      const id = randomUUID();
      await withClient(c => c.query('insert into notificacoes (id, usuario_id, titulo, mensagem, tipo, canal) values ($1,$2,$3,$4,$5,$6)', [id, parsed.data.usuario_id, parsed.data.titulo, parsed.data.mensagem, parsed.data.tipo || null, parsed.data.canal || null]));
      res.status(201).json({ id, usuario_id: parsed.data.usuario_id, titulo: parsed.data.titulo, mensagem: parsed.data.mensagem, lida: false, data_criacao: new Date().toISOString(), tipo: parsed.data.tipo || null, canal: parsed.data.canal || null });
    } catch (err:any) {
      logger.error({ err }, 'create_notification_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return app;
}

// start consumer async (fire and forget)
startUserEventsConsumer().catch(err => logger.error({ err }, 'user_events_consumer_failed_start'));