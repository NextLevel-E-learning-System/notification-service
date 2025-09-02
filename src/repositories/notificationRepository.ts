import { withClient } from '../db.js';
export async function listByUser(userId:string){ return withClient(async c=>{ const r= await c.query('select id, usuario_id, titulo, mensagem, tipo, canal, lida, data_criacao from notificacoes where usuario_id=$1 order by data_criacao desc limit 100',[userId]); return r.rows; }); }
export async function insertNotification(d:any){ return withClient(async c=>{ await c.query('insert into notificacoes (id, usuario_id, titulo, mensagem, tipo, canal) values ($1,$2,$3,$4,$5,$6)',[d.id,d.usuario_id,d.titulo,d.mensagem,d.tipo||null,d.canal||null]); }); }
