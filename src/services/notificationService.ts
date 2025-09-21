import { withClient } from '../config/db.js';
import type { CreateNotificationData, Notification } from '../types/index.js';

/**
 * Cria uma nova notificação in-app para o usuário
 */
export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      INSERT INTO notification_service.notificacoes 
      (usuario_id, titulo, mensagem, tipo, canal)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.usuario_id, data.titulo, data.mensagem, data.tipo || null, data.canal || 'app']);
    
    console.log(`[notification-service] Notificação criada para usuário ${data.usuario_id}: ${data.titulo}`);
    return rows[0];
  });
}

/**
 * Busca notificações de um usuário (com paginação)
 */
export async function getUserNotifications(
  userId: string, 
  limit: number = 20, 
  offset: number = 0,
  onlyUnread: boolean = false
): Promise<Notification[]> {
  return await withClient(async (client) => {
    const whereClause = onlyUnread 
      ? 'WHERE usuario_id = $1 AND lida = false'
      : 'WHERE usuario_id = $1';
    
    const { rows } = await client.query(`
      SELECT * FROM notification_service.notificacoes 
      ${whereClause}
      ORDER BY data_criacao DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return rows;
  });
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
  return await withClient(async (client) => {
    const { rowCount } = await client.query(`
      UPDATE notification_service.notificacoes 
      SET lida = true 
      WHERE id = $1 AND usuario_id = $2
    `, [notificationId, userId]);
    
    return (rowCount || 0) > 0;
  });
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  return await withClient(async (client) => {
    const { rowCount } = await client.query(`
      UPDATE notification_service.notificacoes 
      SET lida = true 
      WHERE usuario_id = $1 AND lida = false
    `, [userId]);
    
    const count = rowCount || 0;
    console.log(`[notification-service] ${count} notificações marcadas como lidas para usuário ${userId}`);
    return count;
  });
}

/**
 * Conta notificações não lidas de um usuário
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      SELECT COUNT(*) as count 
      FROM notification_service.notificacoes 
      WHERE usuario_id = $1 AND lida = false
    `, [userId]);
    
    return parseInt(rows[0].count);
  });
}

/**
 * Remove notificações antigas (mais de 90 dias)
 */
export async function cleanupOldNotifications(): Promise<number> {
  return await withClient(async (client) => {
    const { rowCount } = await client.query(`
      DELETE FROM notification_service.notificacoes 
      WHERE data_criacao < NOW() - INTERVAL '90 days'
    `);
    
    const count = rowCount || 0;
    if (count > 0) {
      console.log(`[notification-service] ${count} notificações antigas removidas`);
    }
    return count;
  });
}

// Função auxiliar para verificar se funcionário existe
export async function getFuncionarioById(funcionarioId: string): Promise<string | null> {
  return await withClient(async (client) => {
    const { rows } = await client.query(`
      SELECT id FROM user_service.funcionarios 
      WHERE id = $1 AND ativo = true
    `, [funcionarioId]);
    
    return rows.length > 0 ? rows[0].id : null;
  });
}

// Esta função não é mais necessária pois agora usamos diretamente o funcionario_id
export async function getAuthUserIdByFuncionarioId(funcionarioId: string): Promise<string | null> {
  // Na nova estrutura, funcionario_id é usado diretamente
  // Vamos apenas verificar se o funcionário existe
  const funcionario = await getFuncionarioById(funcionarioId);
  return funcionario; // retorna o próprio funcionario_id se existir
}
