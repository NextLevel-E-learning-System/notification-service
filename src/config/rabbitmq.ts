import amqplib from 'amqplib';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any | undefined;
const EXCHANGE_USER = process.env.EXCHANGE_USER || 'user.events';
const EXCHANGE_AUTH = process.env.EXCHANGE_AUTH || 'auth.events';
const EXCHANGE_PROGRESS = process.env.EXCHANGE_PROGRESS || 'progress.events';
const EXCHANGE_ASSESSMENT = process.env.EXCHANGE_ASSESSMENT || 'assessment.events';
const EXCHANGE_GAMIFICATION = process.env.EXCHANGE_GAMIFICATION || 'gamification.events';

export async function connectRabbitMQ() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_USER, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_AUTH, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_PROGRESS, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_ASSESSMENT, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_GAMIFICATION, 'direct', { durable: true });
  channel.prefetch(30);
  return channel;
}

export function getChannel() { return channel; }
