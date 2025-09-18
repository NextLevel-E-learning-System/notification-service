import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { loadOpenApi } from './config/openapi.js';
import { templateRouter } from './routes/templateRoutes.js';
import { filaRouter } from './routes/filaRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:'*'}));
app.get('/openapi.json', async (_req,res)=> {
  try {
    const spec = await loadOpenApi('Notification Service API');
    res.json(spec);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load OpenAPI spec' });
  }
});
// Rotas
app.use('/notifications/v1/templates', templateRouter);
app.use('/notifications/v1/filas', filaRouter);
app.use('/notifications/v1/notificacoes', notificationRouter);

export default app;
