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
  
  // User events - eventos do user-service
  const userEventKeys = [
    'user.created',
    'user.password_reset', 
    'user.role_changed',
    'user.updated',
    'user.deactivated'
  ];
  for (const routingKey of userEventKeys) {
    await channel.bindQueue(QUEUE_NOTIFICATION_USER, EXCHANGE_USER, routingKey);
  }
  
  // Auth events - eventos do auth-service
  const authEventKeys = [
    'auth.login',
    'auth.logout', 
    'auth.token_refresh'
  ];
  for (const routingKey of authEventKeys) {
    await channel.bindQueue(QUEUE_NOTIFICATION_AUTH, EXCHANGE_AUTH, routingKey);
  }
}

export async function startConsumer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel: any = await connectRabbitMQ();
  await assertBindings(channel);

  // Consumer para eventos de usuário
  channel.consume(QUEUE_NOTIFICATION_USER, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`[notification-service] Processando evento user: ${event.type}`, event.payload);
      
      switch (event.type) {
        case 'user.created':
          await queuePasswordEmail(
            event.payload.email, 
            event.payload.senha, 
            'register'
          );
          break;
          
        case 'user.password_reset':
          await queuePasswordEmail(
            event.payload.email, 
            event.payload.senha, 
            'reset'
          );
          break;
          
        case 'user.role_changed':
          console.log(`[notification-service] Role alterada: usuário ${event.payload.userId} -> ${event.payload.role}`);
          // Aqui você pode enviar email de notificação sobre mudança de role
          break;
          
        case 'user.updated':
          console.log(`[notification-service] Usuário ${event.payload.userId} atualizado:`, event.payload.changes);
          break;
          
        case 'user.deactivated':
          console.log(`[notification-service] Usuário ${event.payload.userId} desativado`);
          break;
          
        default:
          console.log(`[notification-service] Evento user desconhecido: ${event.type}`);
      }
      channel.ack(msg);
    } catch (err) {
      console.error('[notification-service] Erro processando evento user:', err);
      channel.nack(msg, false, false);
    }
  });

  // Consumer para eventos de autenticação
  channel.consume(QUEUE_NOTIFICATION_AUTH, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`[notification-service] Processando evento auth: ${event.type}`, event.payload);
      
      switch (event.type) {
        case 'auth.login':
          console.log(`[notification-service] Login: usuário ${event.payload.userId}`);
          // Aqui você pode implementar notificações de login suspeito, etc.
          break;
          
        case 'auth.logout':
          console.log(`[notification-service] Logout: usuário ${event.payload.userId}`);
          break;
          
        case 'auth.token_refresh':
          console.log(`[notification-service] Token refresh: usuário ${event.payload.userId}`);
          break;
          
        default:
          console.log(`[notification-service] Evento auth desconhecido: ${event.type}`);
      }
      channel.ack(msg);
    } catch (err) {
      console.error('[notification-service] Erro processando evento auth:', err);
      channel.nack(msg, false, false);
    }
  });
}
