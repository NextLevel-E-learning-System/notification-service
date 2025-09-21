import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import * as NotificationController from '../controllers/notificationController.js';
import { templateSendValidation, templateValidation, validateBody } from '../validation/validators.js';
import { TemplateController } from '../controllers/templateController.js';

export const filaRouter = Router();
filaRouter.get('/', EmailController.getEmailQueue);
filaRouter.post('/:id/retry', EmailController.retryEmail);
filaRouter.post('/process', EmailController.processQueue);
filaRouter.get('/stats', EmailController.getQueueStats);

export const notificationRouter = Router();
notificationRouter.get('/', NotificationController.getNotifications);
notificationRouter.get('/count', NotificationController.getUnreadCount);
notificationRouter.put('/:id/read', NotificationController.markAsRead);
notificationRouter.put('/read-all', NotificationController.markAllAsRead);

export const templateRouter = Router();
templateRouter.get('/', TemplateController.listTemplates);
templateRouter.get('/:codigo', TemplateController.getTemplate);
templateRouter.post('/', validateBody(templateValidation), TemplateController.createTemplate);
templateRouter.post('/:codigo/send', validateBody(templateSendValidation), TemplateController.sendNotificationFromTemplate);
