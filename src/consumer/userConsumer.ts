import { ConsumeMessage } from 'amqplib';
import { connectRabbitMQ } from "../config/rabbitmq.js";
import { sendRegistrationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { createNotification, getUserIdByAuthId, getAuthUserIdByFuncionarioId } from "../services/notificationService.js";

const EXCHANGE_USER = process.env.EXCHANGE_USER || 'user.events';
const EXCHANGE_AUTH = process.env.EXCHANGE_AUTH || 'auth.events';
const QUEUE_NOTIFICATION_USER = process.env.QUEUE_NOTIFICATION_USER || 'notification.user';
const QUEUE_NOTIFICATION_AUTH = process.env.QUEUE_NOTIFICATION_AUTH || 'notification.auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBindings(channel: any) {
  await channel.assertExchange(EXCHANGE_USER, 'direct', { durable: true });
  await channel.assertExchange(EXCHANGE_AUTH, 'direct', { durable: true });
  await channel.assertQueue(QUEUE_NOTIFICATION_USER, { durable: true });
  await channel.assertQueue(QUEUE_NOTIFICATION_AUTH, { durable: true });
  
  // User events - eventos do user-service
  const userEventKeys = [
    'user.created',
    'user.password_reset', 
    'user.role_changed',
    'user.updated',
    'user.deactivated'
  ];
  for (const routingKey of userEventKeys) {
    await channel.bindQueue(QUEUE_NOTIFICATION_USER, EXCHANGE_USER, routingKey);
  }
  
  // Auth events - eventos do auth-service
  const authEventKeys = [
    'auth.login',
    'auth.logout', 
    'auth.token_refresh',
    'auth.user_created',
    'auth.user_password_ephemeral'
  ];
  for (const routingKey of authEventKeys) {
    await channel.bindQueue(QUEUE_NOTIFICATION_AUTH, EXCHANGE_AUTH, routingKey);
  }
}

export async function startConsumer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel: any = await connectRabbitMQ();
  await assertBindings(channel);

      // Consumer para eventos de usuário
      channel.consume(QUEUE_NOTIFICATION_USER, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`[notification-service] Processando evento user: ${event.type}`, event.payload);
          
          switch (event.type) {
            case 'user.created':
              // Caso legado onde user-service ainda possa emitir user.created com senha (fase transição)
              if (event.payload?.email && event.payload?.senha) {
                try {
                  await sendRegistrationEmail({
                    nome: event.payload.nome || 'Usuário',
                    email: event.payload.email,
                    senha: event.payload.senha
                  });
                } catch (emailErr) {
                  console.error('[notification-service] Falha ao enviar email de registro (user.created):', emailErr);
                }
              } else {
                console.log('[notification-service] user.created sem senha - nenhum email de credenciais enviado');
              }
              
              // Criar notificação de boas-vindas
              try {
                // user.created vem do user-service: payload.userId é id do funcionario
                const authUserId = await getAuthUserIdByFuncionarioId(event.payload.userId);
                if (!authUserId) {
                  console.warn('[notification-service] funcionario ainda não vinculado a auth_user_id para notificação welcome. Retry em próximo evento.');
                } else {
                  await createNotification({
                    usuario_id: authUserId,
                    titulo: '🎉 Bem-vindo ao NextLevel! (Perfil)',
                    mensagem: `Olá ${event.payload.nome || 'usuário'}! Seu perfil foi criado/atualizado com sucesso.`,
                    tipo: 'welcome',
                    canal: 'app'
                  });
                }
              } catch (notifError) {
                console.error('[notification-service] Erro criando notificação de boas-vindas:', notifError);
              }
              break;
              
            case 'user.password_reset':
              // Enviar email com nova senha diretamente
              if (event.payload?.email && event.payload?.senha) {
                try {
                  await sendPasswordResetEmail({
                    nome: event.payload.nome || 'Usuário',
                    email: event.payload.email,
                    novaSenha: event.payload.senha
                  });
                } catch (emailErr) {
                  console.error('[notification-service] Falha ao enviar email de reset (user.password_reset):', emailErr);
                }
              }
              
              // Criar notificação de reset de senha
              try {
                const authUserId = await getAuthUserIdByFuncionarioId(event.payload.userId);
                if (authUserId) {
                  await createNotification({
                    usuario_id: authUserId,
                    titulo: '🔑 Senha Redefinida',
                    mensagem: 'Sua senha foi redefinida com sucesso. Verifique seu email para obter a nova senha.',
                    tipo: 'password_reset',
                    canal: 'app'
                  });
                } else {
                  console.warn('[notification-service] password_reset sem auth_user_id mapeado ainda (ignorado)');
                }
              } catch (notifError) {
                console.error('[notification-service] Erro criando notificação de reset:', notifError);
              }
              break;
              
            case 'user.role_changed':
              // Criar notificação de mudança de role
              try {
                const authUserId = await getAuthUserIdByFuncionarioId(event.payload.userId);
                if (authUserId) {
                  await createNotification({
                    usuario_id: authUserId,
                    titulo: '👤 Permissão Alterada',
                    mensagem: `Seu nível de acesso foi alterado para: ${event.payload.role}`,
                    tipo: 'role_change',
                    canal: 'app'
                  });
                  console.log(`[notification-service] Notificação de role criada para usuário ${event.payload.userId}`);
                } else {
                  console.warn('[notification-service] role_changed sem auth_user_id mapeado (ignorado)');
                }
              } catch (notifError) {
                console.error('[notification-service] Erro criando notificação de role:', notifError);
              }
              break;
              
            case 'user.updated':
              // Criar notificação de atualização de perfil
              try {
                const authUserId = await getAuthUserIdByFuncionarioId(event.payload.userId);
                if (authUserId) {
                  await createNotification({
                    usuario_id: authUserId,
                    titulo: '✏️ Perfil Atualizado',
                    mensagem: 'Suas informações de perfil foram atualizadas com sucesso.',
                    tipo: 'profile_update',
                    canal: 'app'
                  });
                }
              } catch (notifError) {
                console.error('[notification-service] Erro criando notificação de update:', notifError);
              }
              break;
              
            case 'user.deactivated':
              // Criar notificação de desativação (se o usuário ainda tem acesso)
              try {
                const authUserId = await getAuthUserIdByFuncionarioId(event.payload.userId);
                if (authUserId) {
                  await createNotification({
                    usuario_id: authUserId,
                    titulo: '⚠️ Conta Desativada',
                    mensagem: 'Sua conta foi desativada. Entre em contato com o administrador para mais informações.',
                    tipo: 'account_deactivated',
                    canal: 'app'
                  });
                }
              } catch (notifError) {
                console.error('[notification-service] Erro criando notificação de desativação:', notifError);
              }
              break;
              
            default:
              console.log(`[notification-service] Evento user desconhecido: ${event.type}`);
          }
          channel.ack(msg);
        } catch (err) {
          console.error('[notification-service] Erro processando evento user:', err);
          channel.nack(msg, false, false);
        }
      });

  // Consumer para eventos de autenticação
  channel.consume(QUEUE_NOTIFICATION_AUTH, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`[notification-service] Processando evento auth: ${event.type}`, event.payload);
      
      switch (event.type) {
        case 'auth.user_created':
          // Evento persistido sem senha: neste momento não enviamos email com credenciais.
          // Opcional: enviar email de boas-vindas genérico ou acionar fluxo de criação de senha via link.
          console.log('[notification-service] auth.user_created recebido (sem senha) - nenhum email enviado');
          break;
        case 'auth.user_password_ephemeral':
          // Evento efêmero contendo a senha real (não armazenada em DB no auth-service)
          try {
            if (event.payload?.email && event.payload?.senha) {
              await sendRegistrationEmail({
                nome: event.payload.nome || 'Usuário',
                email: event.payload.email,
                senha: event.payload.senha
              });
              console.log('[notification-service] Email de registro enviado para:', event.payload.email);
            } else {
              console.warn('[notification-service] auth.user_password_ephemeral sem email ou senha válidos');
            }
          } catch (e) {
            console.error('[notification-service] Erro processando auth.user_password_ephemeral:', e);
            // Não fazer nack aqui - apenas log o erro para não perder a mensagem por timeout SMTP
          }
          break;
        case 'auth.login':
          // Verificar se é um login suspeito (optional: diferentes IPs, etc.)
          try {
            const userId = await getUserIdByAuthId(event.payload.userId);
            if (userId) {
              await createNotification({
                usuario_id: userId,
                titulo: '🔐 Novo Acesso',
                mensagem: `Novo login detectado em ${new Date(event.payload.timestamp).toLocaleString('pt-BR')}`,
                tipo: 'login',
                canal: 'app'
              });
            }
          } catch (notifError) {
            console.error('[notification-service] Erro criando notificação de login:', notifError);
          }
          break;
          
        case 'auth.logout':
          console.log(`[notification-service] Logout registrado: usuário ${event.payload.userId}`);
          // Não criar notificação para logout por ser muito comum
          break;
          
        case 'auth.token_refresh':
          // Não criar notificação para refresh por ser automático
          console.log(`[notification-service] Token refresh: usuário ${event.payload.userId}`);
          break;
          
        default:
          console.log(`[notification-service] Evento auth desconhecido: ${event.type}`);
      }
      channel.ack(msg);
    } catch (err) {
      console.error('[notification-service] Erro processando evento auth:', err);
      channel.nack(msg, false, false);
    }
  });
}
