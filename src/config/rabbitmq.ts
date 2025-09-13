import amqplib from 'amqplib';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any | undefined;
const EXCHANGE_USER = process.env.EXCHANGE_USER || 'user.events';
const EXCHANGE_AUTH = process.env.EXCHANGE_AUTH || 'auth.events';

export async function connectRabbitMQ() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_USER, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_AUTH, 'direct', { durable: true });
  channel.prefetch(30);
  return channel;
}

export function getChannel() { return channel; }
