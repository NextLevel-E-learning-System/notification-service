import { config } from 'dotenv';
config();
import { createServer } from './server.js';
import { startConsumer } from './consumer/userConsumer.js';

// Iniciar servidor web
const port = Number(process.env.PORT || 3333);
createServer().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[auth-service] listening on ${port}`);
});
// Iniciar consumer RabbitMQ
startConsumer().catch(console.error);

console.log('[notification-service] Iniciado com servidor e consumer (RabbitMQ) - outbox removido.');
