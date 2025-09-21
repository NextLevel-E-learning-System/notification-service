import { Router, Request, Response } from 'express';
import { 
  listTemplates, 
  getTemplate, 
  upsertTemplate, 
  createNotificationFromTemplate,
  type TemplateVariables 
} from '../services/templateService.js';

export const templateRouter = Router();

// GET /api/v1/notifications/templates - Listar todos os templates
templateRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await listTemplates();
    res.json(templates);
  } catch (error) {
    console.error('[notification-service] Erro listando templates:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/v1/notifications/templates/:codigo - Buscar template específico
templateRouter.get('/:codigo', async (req: Request, res: Response) => {
  try {
    const template = await getTemplate(req.params.codigo);
    if (!template) {
      return res.status(404).json({ error: 'template_not_found' });
    }
    res.json(template);
  } catch (error) {
    console.error('[notification-service] Erro buscando template:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/v1/notifications/templates - Criar/atualizar template
templateRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { codigo, titulo, corpo, variaveis, ativo = true } = req.body;
    
    if (!codigo || !titulo || !corpo) {
      return res.status(400).json({ 
        error: 'required_fields_missing',
        required: ['codigo', 'titulo', 'corpo']
      });
    }

    const template = await upsertTemplate({
      codigo,
      titulo, 
      corpo,
      variaveis: variaveis || [],
      ativo
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('[notification-service] Erro criando/atualizando template:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/v1/notifications/templates/:codigo/send - Enviar notificação usando template
templateRouter.post('/:codigo/send', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { usuario_id, variables, tipo, canal } = req.body;
    
    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id_required' });
    }

    const notification = await createNotificationFromTemplate(
      codigo,
      usuario_id,
      variables as TemplateVariables || {},
      tipo,
      canal
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'template_not_found' });
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('[notification-service] Erro enviando notificação com template:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
