import amqp from 'amqplib';
import pino from 'pino';
import { randomUUID } from 'crypto';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const EXCHANGE = 'users.events';
const QUEUE = 'notification-service.users';

export async function startUserEventsConsumer() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertQueue(QUEUE, { durable: true });
  await ch.bindQueue(QUEUE, EXCHANGE, 'users.v1.*');
  ch.consume(QUEUE, msg => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      logger.info({ eventType: event.type, id: event.id }, 'received_user_event');
      if (event.type === 'users.v1.UserRegistered') {
        // Aqui criaria uma notificação de boas vindas
        logger.info({ userId: event.payload.userId }, 'would_create_welcome_notification');
      }
      ch.ack(msg);
    } catch (err) {
      logger.error({ err }, 'failed_processing_event');
      ch.nack(msg, false, false); // discarta por enquanto
    }
  });
  logger.info('notification-service user events consumer started');
}