import { Router } from 'express';
import { listNotificationsHandler, createNotificationHandler } from '../controllers/notificationController.js';
export const notificationRouter = Router();
notificationRouter.get('/', listNotificationsHandler);
notificationRouter.post('/', createNotificationHandler);
