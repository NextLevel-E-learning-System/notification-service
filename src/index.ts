import { config } from 'dotenv';
config();
import { createServer } from './server.js';
import { startConsumer } from './consumer/userConsumer.js';

const port = Number(process.env.PORT || 3333);

async function startService() {
  try {
    // Iniciar servidor
    createServer().listen(port, () => {
      console.log(`[notification-service] listening on ${port}`);
    });
    
    // Iniciar consumer de eventos
    await startConsumer();
  } catch (error) {
    console.error('[notification-service] Erro ao inicializar serviço:', error);
    process.exit(1);
  }
}

startService();