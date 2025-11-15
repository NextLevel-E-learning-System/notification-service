import { Router } from 'express';
import * as NotificationController from '../controllers/notificationController.js';

export const notificationRouter = Router();
notificationRouter.get('/', NotificationController.getNotifications);
notificationRouter.get('/count', NotificationController.getUnreadCount);
notificationRouter.put('/:id/read', NotificationController.markAsRead);
notificationRouter.put('/read-all', NotificationController.markAllAsRead);
