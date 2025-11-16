import { withClient } from '../config/db.js';
import type { NotificationTemplate, TemplateVariables } from '../types/index.js';

/**
 * Busca template por código
 */
export async function getTemplate(codigo: string): Promise<NotificationTemplate | null> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      SELECT * FROM notification_service.templates 
      WHERE codigo = $1 AND ativo = true
    `, [codigo]);
    
    return rows.length > 0 ? rows[0] : null;
  });
}

/**
 * Lista todos os templates ativos
 */
export async function listTemplates(): Promise<NotificationTemplate[]> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      SELECT * FROM notification_service.templates 
      WHERE ativo = true 
      ORDER BY criado_em DESC
    `);
    
    return rows;
  });
}

/**
 * Cria ou atualiza um template
 */
export async function upsertTemplate(template: Omit<NotificationTemplate, 'criado_em'>): Promise<NotificationTemplate> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      INSERT INTO notification_service.templates (codigo, titulo, corpo, variaveis, ativo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (codigo) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        corpo = EXCLUDED.corpo,
        variaveis = EXCLUDED.variaveis,
        ativo = EXCLUDED.ativo
      RETURNING *
    `, [template.codigo, template.titulo, template.corpo, template.variaveis, template.ativo]);
    
    return rows[0];
  });
}

/**
 * Processa template substituindo variáveis
 */
export function processTemplate(template: NotificationTemplate, variables: TemplateVariables): { titulo: string; mensagem: string } {
  let titulo = template.titulo;
  let mensagem = template.corpo;
  
  // Substituir variáveis no formato {variavel}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    titulo = titulo.replace(regex, String(value));
    mensagem = mensagem.replace(regex, String(value));
  }
  
  return { titulo, mensagem };
}

/**
 * Cria notificação usando template
 */
export async function createNotificationFromTemplate(
  templateCodigo: string,
  userId: string,
  variables: TemplateVariables,
  tipo?: string,
  canal?: string
): Promise<{ id: number; titulo: string; mensagem: string } | null> {
  const template = await getTemplate(templateCodigo);
  if (!template) {
    console.warn(`[notification-service] Template não encontrado: ${templateCodigo}`);
    return null;
  }
  
  const { titulo, mensagem } = processTemplate(template, variables);
  
  // Importar createNotification de forma dinâmica para evitar dependência circular
  const { createNotification } = await import('./notificationService.js');
  
  const notification = await createNotification({
    funcionario_id: userId,
    titulo,
    mensagem,
    tipo,
    canal
  });
  
  console.log(`[notification-service] Notificação criada com template ${templateCodigo} para usuário ${userId}`);
  
  return {
    id: notification.id,
    titulo: notification.titulo,
    mensagem: notification.mensagem
  };
}

