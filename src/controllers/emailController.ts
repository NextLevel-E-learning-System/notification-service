import { Request, Response } from 'express';
import { withClient } from '../config/db.js';
import { processEmailQueue } from '../services/emailService.js';

export class EmailController {
  /**
   * Listar fila de emails
   */
  static async getEmailQueue(req: Request, res: Response) {
    try {
      const { rows } = await withClient(c =>
        c.query('SELECT * FROM notification_service.filas_email ORDER BY data_envio DESC LIMIT 50')
      );
      res.json(rows);
    } catch (error) {
      console.error('[email-controller] Erro listando fila de emails:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Retentar envio de email
   */
  static async retryEmail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      
      await withClient(c => c.query(
        `UPDATE notification_service.filas_email SET status='PENDENTE' WHERE id=$1 AND status='ERRO'`,
        [id]
      ));
      
      await processEmailQueue();
      res.json({ ok: true });
    } catch (error) {
      console.error('[email-controller] Erro retentando email:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Processar fila de emails manualmente
   */
  static async processQueue(req: Request, res: Response) {
    try {
      await processEmailQueue();
      res.json({ 
        message: 'email_queue_processed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[email-controller] Erro processando fila:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Estatísticas da fila de emails
   */
  static async getQueueStats(req: Request, res: Response) {
    try {
      const { rows } = await withClient(async c => {
        const result = await c.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM notification_service.filas_email 
          GROUP BY status
        `);
        return result;
      });

      const stats = rows.reduce((acc, row) => {
        acc[row.status.toLowerCase()] = parseInt(row.count);
        return acc;
      }, {
        pendente: 0,
        enviado: 0,
        erro: 0
      });

      res.json(stats);
    } catch (error) {
      console.error('[email-controller] Erro obtendo estatísticas:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }
}