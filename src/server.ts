import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { loadOpenApi } from './config/openapi.js';
import { logger } from './config/logger.js';
import { healthRouter } from './routes/healthRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startUserEventsConsumer } from './workers/userEventsConsumer.js';
export function createServer(){ const app=express(); app.use(express.json()); app.use(cors({origin:'*'})); app.use((req,_res,next)=>{ (req as any).log=logger; next();}); const spec=loadOpenApi('Notification Service API'); app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec)); app.use(healthRouter); app.use('/notifications/v1', notificationRouter); app.use(errorHandler); startUserEventsConsumer().catch(err=> logger.error({err},'user_events_consumer_failed_start')); return app; }