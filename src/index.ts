import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { startConsumer } from './consumer/userConsumer.js';
import path from 'path';
import app from './server.js';
// Carrega .env explicitamente (diretório fixo do serviço)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

// Validação de variáveis obrigatórias antes de subir servidor
const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter(v => !process.env[v]);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error('[notification-service][startup] Variáveis obrigatórias ausentes:', missing.join(', '));
  throw new Error('Variáveis de ambiente obrigatórias ausentes.');
}

 
const port = Number(process.env.PORT || 3333);
if (process.env.LOG_LEVEL === 'debug') {
  // eslint-disable-next-line no-console
  console.log('[notification-service][startup] Variáveis carregadas OK. Porta:', port);
}
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[notification-service] listening on ${port}`);
});
startConsumer().catch(console.error);