import dotenv from 'dotenv';
dotenv.config();
import './services/worker.js';

console.log('[notification-service] Iniciado e processando fila/outbox...');
