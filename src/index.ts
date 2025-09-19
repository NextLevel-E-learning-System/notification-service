import dotenv from 'dotenv';
dotenv.config();
import app from './server.js';
import { startConsumer } from './consumer/userConsumer.js';

// Iniciar servidor web
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`[notification-service] Servidor rodando na porta ${PORT}`);
});

// Iniciar consumer RabbitMQ
startConsumer().catch(console.error);

console.log('[notification-service] Iniciado com servidor e consumer (RabbitMQ) - outbox removido.');
