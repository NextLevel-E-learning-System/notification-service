import { withClient } from '../config/db.js';
import { queuePasswordEmail, processEmailQueue } from './emailService.js';

export async function processOutboxEvents() {
  await withClient(async c => {
    const { rows } = await c.query(`
      SELECT * FROM user_service.outbox_events 
      WHERE processed=false ORDER BY created_at LIMIT 10
    `);

    for (const event of rows) {
      try {
        const payload = JSON.parse(event.payload);

        if (event.topic === 'user.created') {
          await queuePasswordEmail(payload.email, payload.password, 'register');
        }
        if (event.topic === 'user.password_reset') {
          await queuePasswordEmail(payload.email, payload.password, 'reset');
        }

        await c.query(`UPDATE user_service.outbox_events SET processed=true WHERE id=$1`, [event.id]);
      } catch (err) {
        console.error(`[notification-service][worker] Falha processar evento`, err);
      }
    }
  });

  await processEmailQueue();
}

// roda a cada 5s
setInterval(() => {
  processOutboxEvents().catch(console.error);
}, 5000);
