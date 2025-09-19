import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import swaggerUi from 'swagger-ui-express';
import { templateRouter } from './routes/templateRoutes.js';
import { filaRouter } from './routes/filaRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

  const app = express();
  app.use(express.json());
  const allowAll = process.env.ALLOW_ALL_ORIGINS === 'true';
  app.use(cors({
    origin: allowAll ? (origin, cb) => cb(null, true) : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true
  }));
  app.use(cookieParser());
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  // Docs
  const openapiSpec = loadOpenApi('Notification Service API');
  app.get('/openapi.json', (_req,res)=> res.json(openapiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Core routes
  app.use('/notifications/v1/templates', templateRouter);
app.use('/notifications/v1/filas', filaRouter);
app.use('/notifications/v1/notificacoes', notificationRouter);

  // Error handler
  app.use(errorHandler);

  export default app;