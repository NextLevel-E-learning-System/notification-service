import { Request, Response } from 'express';
import { 
  listTemplates, 
  getTemplate, 
  upsertTemplate, 
  createNotificationFromTemplate
} from '../services/templateService.js';
import type { TemplateVariables } from '../types/index.js';

export class TemplateController {
  /**
   * Listar todos os templates
   */
  static async listTemplates(req: Request, res: Response) {
    try {
      const templates = await listTemplates();
      res.json(templates);
    } catch (error) {
      console.error('[template-controller] Erro listando templates:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Buscar template específico
   */
  static async getTemplate(req: Request, res: Response) {
    try {
      const template = await getTemplate(req.params.codigo);
      if (!template) {
        return res.status(404).json({ error: 'template_not_found' });
      }
      res.json(template);
    } catch (error) {
      console.error('[template-controller] Erro buscando template:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Criar/atualizar template
   */
  static async createTemplate(req: Request, res: Response) {
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
      console.error('[template-controller] Erro criando/atualizando template:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Enviar notificação usando template
   */
  static async sendNotificationFromTemplate(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const { funcionario_id, variables, tipo, canal } = req.body;
      
      if (!funcionario_id) {
        return res.status(400).json({ error: 'funcionario_id_required' });
      }

      const notification = await createNotificationFromTemplate(
        codigo,
        funcionario_id,
        variables as TemplateVariables || {},
        tipo,
        canal
      );
      
      if (!notification) {
        return res.status(404).json({ error: 'template_not_found' });
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('[template-controller] Erro enviando notificação com template:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }
}