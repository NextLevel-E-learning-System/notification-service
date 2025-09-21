import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import { templateRouter } from './routes/templateRoutes.js';
import { filaRouter } from './routes/filaRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createServer() {
  const app = express();
app.use(express.json());
  const allowAll = process.env.ALLOW_ALL_ORIGINS === 'true';
  app.use(cors({
    origin: allowAll ? (origin, cb) => cb(null, true) : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true
  }));
app.use(cookieParser());
app.use((req, _res, next) => { (req as any).log = logger; next(); });

app.get('/openapi.json', async (_req,res)=> {
  try {
    const openapiSpec = await loadOpenApi('Notification Service API');
    res.json(openapiSpec);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load OpenAPI spec' });
  }
});

app.use('/notifications/v1/templates', templateRouter);
app.use('/notifications/v1/filas', filaRouter);
app.use('/notifications/v1', notificationRouter);
app.use(errorHandler);
  return app;
}