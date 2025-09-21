import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { filaRouter, notificationRouter, templateRouter } from './routes/routes.js';

export function createServer() {
  const app = express();
app.use(express.json());
  const allowAll = process.env.ALLOW_ALL_ORIGINS === 'true';
  app.use(cors({
    origin: allowAll ? (origin, cb) => cb(null, true) : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true
  }));
app.use(cookieParser());
app.use((req, _res, next) => { 
  (req as express.Request & { log: typeof logger }).log = logger; 
  next(); 
});

app.get('/openapi.json', async (_req,res)=> {
  try {
    const openapiSpec = await loadOpenApi('Notification Service API');
    res.json(openapiSpec);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load OpenAPI spec' });
  }
});

// Estrutura de rotas reorganizada e mais clara
app.use('/notifications/v1', notificationRouter);           // Notificações in-app
app.use('/notifications/v1/templates', templateRouter);     // Templates para notificações in-app
app.use('/notifications/v1/email', filaRouter);                    // Fila de emails
app.use(errorHandler);
  return app;
}