import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { loadOpenApi } from './config/openapi.js';
import { templateRouter } from './routes/templateRoutes.js';
import { filaRouter } from './routes/filaRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:'*'}));
const spec=loadOpenApi('Notification Service API');
app.get('/openapi.json', (_req,res)=> res.json(spec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec)); 
// Rotas
app.use('/notifications/v1/templates', templateRouter);
app.use('/notifications/v1/filas', filaRouter);
app.use('/notifications/v1/notificacoes', notificationRouter);

export default app;
