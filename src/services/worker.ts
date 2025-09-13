import { withClient } from '../config/db.js';
import { queuePasswordEmail, processEmailQueue } from './emailService.js';
import { createNotification } from './notificationService.js';

export async function processOutboxEvents() {
  await withClient(async c => {
    // Processar eventos do user-service
    const { rows: userEvents } = await c.query(`
      SELECT * FROM user_service.outbox_events 
      WHERE processed=false ORDER BY created_at LIMIT 10
    `);

    for (const event of userEvents) {
      try {
        const payload = JSON.parse(event.payload);
        console.log(`[notification-service][worker] Processando evento: ${event.topic}`, payload);

        switch (event.topic) {
          case 'user.created':
            if (payload.email && payload.senha) {
              await queuePasswordEmail(payload.email, payload.senha, 'register');
              
              // Criar notificação de boas-vindas
              try {
                await createNotification({
                  usuario_id: payload.userId,
                  titulo: '🎉 Bem-vindo ao NextLevel!',
                  mensagem: `Olá ${payload.nome || 'usuário'}! Sua conta foi criada com sucesso.`,
                  tipo: 'welcome',
                  canal: 'app'
                });
              } catch (notifError) {
                console.error('[notification-service][worker] Erro criando notificação de boas-vindas:', notifError);
              }
            }
            break;
            
          case 'user.password_reset':
            if (payload.email && payload.senha) {
              await queuePasswordEmail(payload.email, payload.senha, 'reset');
              
              // Criar notificação de reset
              try {
                await createNotification({
                  usuario_id: payload.userId,
                  titulo: '🔑 Senha Redefinida',
                  mensagem: 'Sua senha foi redefinida com sucesso. Verifique seu email.',
                  tipo: 'password_reset',
                  canal: 'app'
                });
              } catch (notifError) {
                console.error('[notification-service][worker] Erro criando notificação de reset:', notifError);
              }
            }
            break;
            
          case 'user.role_changed':
            console.log(`[notification-service][worker] Role alterada: ${payload.userId} -> ${payload.role}`);
            try {
              await createNotification({
                usuario_id: payload.userId,
                titulo: '👤 Permissão Alterada',
                mensagem: `Seu nível de acesso foi alterado para: ${payload.role}`,
                tipo: 'role_change',
                canal: 'app'
              });
            } catch (notifError) {
              console.error('[notification-service][worker] Erro criando notificação de role:', notifError);
            }
            break;
            
          case 'user.updated':
            console.log(`[notification-service][worker] Usuário atualizado: ${payload.userId}`);
            break;
            
          case 'user.deactivated':
            console.log(`[notification-service][worker] Usuário desativado: ${payload.userId}`);
            break;
            
          default:
            console.log(`[notification-service][worker] Evento user desconhecido: ${event.topic}`);
        }

        await c.query(`UPDATE user_service.outbox_events SET processed=true WHERE id=$1`, [event.id]);
      } catch (err) {
        console.error(`[notification-service][worker] Falha ao processar evento user ${event.topic}:`, err);
      }
    }

    // Processar eventos do auth-service (se houver outbox no auth)
    try {
      const { rows: authEvents } = await c.query(`
        SELECT * FROM auth_service.outbox_events 
        WHERE published=false ORDER BY created_at LIMIT 10
      `);

      for (const event of authEvents) {
        try {
          const payload = JSON.parse(event.payload);
          console.log(`[notification-service][worker] Processando evento auth: ${event.event_type}`, payload);

          switch (event.event_type) {
            case 'auth.login':
              console.log(`[notification-service][worker] Login registrado: ${payload.userId}`);
              break;
              
            case 'auth.logout':
              console.log(`[notification-service][worker] Logout registrado: ${payload.userId}`);
              break;
              
            case 'auth.token_refresh':
              console.log(`[notification-service][worker] Token refresh: ${payload.userId}`);
              break;
              
            default:
              console.log(`[notification-service][worker] Evento auth desconhecido: ${event.event_type}`);
          }

          await c.query(`UPDATE auth_service.outbox_events SET published=true WHERE id=$1`, [event.id]);
        } catch (err) {
          console.error(`[notification-service][worker] Falha ao processar evento auth ${event.event_type}:`, err);
        }
      }
    } catch (err) {
      // Auth service pode não ter outbox ou estar indisponível
      console.debug('[notification-service][worker] Auth outbox não disponível:', err);
    }
  });

  // Processar fila de emails
  await processEmailQueue();
}

// Executar a cada 5 segundos
setInterval(() => {
  processOutboxEvents().catch(console.error);
}, 5000);
