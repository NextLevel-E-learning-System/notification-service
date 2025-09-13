import nodemailer from 'nodemailer';
import { withClient } from '../config/db.js';
import { buildPasswordTemplate } from '../templates/passwordTemplate.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS // App password do Gmail
  }
});

// Monta template dinâmico
async function renderPasswordTemplate(tipo: 'register' | 'reset', senha: string) {
  return buildPasswordTemplate({ tipo, senha });
}

// Coloca na fila
export async function queuePasswordEmail(destinatario: string, senha: string, tipo: 'register' | 'reset') {
  const html = await renderPasswordTemplate(tipo, senha);
  const subject = tipo === 'register' ? 'Bem-vindo(a) - Sua senha de acesso' : 'Redefinição de senha';

  await withClient(async c => {
    await c.query(`
      INSERT INTO notification_service.filas_email (destinatario, assunto, corpo, status)
      VALUES ($1, $2, $3, 'PENDENTE')
    `, [destinatario, subject, html]);
  });
}

// Processa a fila
export async function processEmailQueue() {
  await withClient(async c => {
    const { rows } = await c.query(`
      SELECT * FROM notification_service.filas_email 
      WHERE status='PENDENTE' ORDER BY data_envio LIMIT 10
    `);

    for (const email of rows) {
      try {
        await transporter.sendMail({
          from: `"NextLevel" <${process.env.EMAIL_USER}>`,
          to: email.destinatario,
          subject: email.assunto,
          html: email.corpo
        });
        await c.query(`UPDATE notification_service.filas_email SET status='ENVIADO' WHERE id=$1`, [email.id]);
      } catch (err) {
        console.error(`[notification-service] Erro ao enviar email`, err);
        await c.query(`UPDATE notification_service.filas_email SET status='ERRO' WHERE id=$1`, [email.id]);
      }
    }
  });
}
