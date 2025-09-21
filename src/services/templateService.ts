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

/**
 * Seeds - Templates padrão do sistema
 */
export async function seedDefaultTemplates(): Promise<void> {
  const defaultTemplates: Omit<NotificationTemplate, 'criado_em'>[] = [
    {
      codigo: 'welcome',
      titulo: '🎉 Bem-vindo ao NextLevel!',
      corpo: 'Olá {nome}! Seu perfil foi criado com sucesso. Explore os cursos disponíveis e comece sua jornada de aprendizado.',
      variaveis: ['nome'],
      ativo: true
    },
    {
      codigo: 'login',
      titulo: '🔐 Novo Acesso',
      corpo: 'Novo login detectado em {data_hora} de {ip}. Se não foi você, entre em contato conosco.',
      variaveis: ['data_hora', 'ip'],
      ativo: true
    },
    {
      codigo: 'password_reset',
      titulo: '🔑 Senha Redefinida',
      corpo: 'Sua senha foi redefinida com sucesso. Verifique seu email para obter a nova senha temporária.',
      variaveis: [],
      ativo: true
    },
    {
      codigo: 'role_change',
      titulo: '👤 Permissão Alterada',
      corpo: 'Seu nível de acesso foi alterado para: {nova_role}. Agora você tem {permissoes} no sistema.',
      variaveis: ['nova_role', 'permissoes'],
      ativo: true
    },
    {
      codigo: 'course_completed',
      titulo: '🏆 Curso Concluído!',
      corpo: 'Parabéns {nome}! Você concluiu o curso "{curso_nome}" e ganhou {xp_ganho} pontos de experiência.',
      variaveis: ['nome', 'curso_nome', 'xp_ganho'],
      ativo: true
    },
    {
      codigo: 'course_assigned',
      titulo: '📚 Novo Curso Atribuído',
      corpo: 'Olá {nome}! O curso "{curso_nome}" foi atribuído a você. Prazo para conclusão: {data_limite}.',
      variaveis: ['nome', 'curso_nome', 'data_limite'],
      ativo: true
    },
    {
      codigo: 'badge_earned',
      titulo: '🎖️ Nova Conquista!',
      corpo: 'Parabéns {nome}! Você conquistou o badge "{badge_nome}": {badge_descricao}',
      variaveis: ['nome', 'badge_nome', 'badge_descricao'],
      ativo: true
    }
  ];
  
  for (const template of defaultTemplates) {
    try {
      await upsertTemplate(template);
      console.log(`[notification-service] Template ${template.codigo} criado/atualizado`);
    } catch (error) {
      console.error(`[notification-service] Erro criando template ${template.codigo}:`, error);
    }
  }
}