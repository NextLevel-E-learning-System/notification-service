import { randomUUID } from 'crypto';
import { insertNotification, listByUser } from '../repositories/notificationRepository.js';
import { HttpError } from '../utils/httpError.js';
export async function listNotifications(userId?:string){ if(!userId) throw new HttpError(401,'missing_user_context'); return listByUser(userId); }
export async function createNotification(data:{ usuario_id:string; titulo:string; mensagem:string; tipo?:string; canal?:string; }){ const id=randomUUID(); await insertNotification({ id, ...data }); return { id, usuario_id:data.usuario_id, titulo:data.titulo, mensagem:data.mensagem, lida:false, data_criacao:new Date().toISOString(), tipo:data.tipo||null, canal:data.canal||null }; }
