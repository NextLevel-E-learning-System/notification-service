import { Router } from 'express';
import { TemplateController } from '../controllers/templateController.js';
import { validateBody, templateValidation, templateSendValidation } from '../validation/validators.js';

export const templateRouter = Router();

// GET /api/v1/notifications/templates - Listar todos os templates
templateRouter.get('/', TemplateController.listTemplates);

// GET /api/v1/notifications/templates/:codigo - Buscar template específico
templateRouter.get('/:codigo', TemplateController.getTemplate);

// POST /api/v1/notifications/templates - Criar/atualizar template
templateRouter.post('/', validateBody(templateValidation), TemplateController.createTemplate);

// POST /api/v1/notifications/templates/:codigo/send - Enviar notificação usando template
templateRouter.post('/:codigo/send', validateBody(templateSendValidation), TemplateController.sendNotificationFromTemplate);
