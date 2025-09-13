import { ConsumeMessage } from 'amqplib';
import { connectRabbitMQ } from "../config/rabbitmq";
import { queuePasswordEmail } from "../services/emailService";

const EXCHANGE_USER = process.env.EXCHANGE_USER || 'user.events';
const EXCHANGE_AUTH = process.env.EXCHANGE_AUTH || 'auth.events';
const QUEUE_NOTIFICATION_USER = process.env.QUEUE_NOTIFICATION_USER || 'notification.user';
const QUEUE_NOTIFICATION_AUTH = process.env.QUEUE_NOTIFICATION_AUTH || 'notification.auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBindings(channel: any) {
  await channel.assertExchange(EXCHANGE_USER, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_AUTH, 'direct', { durable: true });
  await channel.assertQueue(QUEUE_NOTIFICATION_USER, { durable: true });
  await channel.assertQueue(QUEUE_NOTIFICATION_AUTH, { durable: true });
  // user events
  for (const rk of ['user.created','user.password_reset','user.role_changed']) {
    await channel.bindQueue(QUEUE_NOTIFICATION_USER, EXCHANGE_USER, rk);
  }
  // auth events
  for (const rk of ['auth.login','auth.logout','auth.password_reset']) {
    await channel.bindQueue(QUEUE_NOTIFICATION_AUTH, EXCHANGE_AUTH, rk);
  }
}

export async function startConsumer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel: any = await connectRabbitMQ();
  await assertBindings(channel);

  channel.consume(QUEUE_NOTIFICATION_USER, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      switch (event.type) {
        case 'user.created':
          await queuePasswordEmail(event.payload.email, event.payload.senha, 'register');
          break;
        case 'user.password_reset':
          await queuePasswordEmail(event.payload.email, event.payload.senha, 'reset');
          break;
        case 'user.role_changed':
          console.log(`[notification-service] role_changed ${event.payload.userId} -> ${event.payload.role}`);
          break;
        default:
          console.log('[notification-service] evento user desconhecido', event.type);
      }
      channel.ack(msg);
    } catch (err) {
      console.error('[notification-service] erro processando evento user', err);
      channel.nack(msg, false, false);
    }
  });

  channel.consume(QUEUE_NOTIFICATION_AUTH, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      switch (event.type) {
        case 'auth.login':
        case 'auth.logout':
        case 'auth.password_reset':
          console.log('[notification-service] auth evt', event.type, event.payload);
          break;
        default:
          console.log('[notification-service] evento auth desconhecido', event.type);
      }
      channel.ack(msg);
    } catch (err) {
      console.error('[notification-service] erro processando evento auth', err);
      channel.nack(msg, false, false);
    }
  });
}
