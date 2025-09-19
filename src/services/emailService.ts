import nodemailer from 'nodemailer';
import { withClient } from '../config/db.js';
import { buildPasswordTemplate } from '../templates/passwordTemplate.js';

let transporter: nodemailer.Transporter | null = null;

function buildTransporter() {
    if (transporter) return transporter;
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        throw new Error('smtp_nao_configurado');
    }
    const enableDebug = process.env.SMTP_DEBUG === 'true';
    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        },
        logger: enableDebug,
        debug: enableDebug
    });
    if (enableDebug) {
        console.log('[email][transporter_created]', { host, port, user });
    }
    return transporter;
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
    const from = 'no-reply@nextlevel.com';
    const t = buildTransporter();
    try {
    const info = await t.sendMail({ from, to, subject, text, html: html || `<pre>${text}</pre>` });
        if (process.env.SMTP_DEBUG === 'true') {
            console.log('[email][sent]', { to, subject, messageId: info.messageId });
        }
        return info;
  } catch (err) {
    const e = err as Error & { code?: string; command?: string };
    console.error('[email][send_fail]', { to, subject, err: e.message, code: e.code, command: e.command });
    throw e;
    }
}

export async function sendRegistrationEmail(params: { nome: string; email: string; senha: string; }) {
    const html = buildPasswordTemplate({ tipo: 'register', senha: params.senha });
      const subject = '🎓 Acesso Criado - NextLevel';
      await withClient(async c => {
    await c.query(
      `INSERT INTO notification_service.filas_email (destinatario, assunto, corpo, status)
       VALUES ($1,$2,$3,'PENDENTE')`,
      [params.email, subject, html]
    );
  });
    // Texto em branco: senha só aparece no HTML conforme template fornecido
    return sendMail(params.email, subject, '', html);
}

export async function sendPasswordResetEmail(params: { nome: string; email: string; novaSenha: string; }) {
    const html = buildPasswordTemplate({ tipo: 'reset', senha: params.novaSenha });
      const subject ='🔐 Senha Redefinida - NextLevel';

     await withClient(async c => {
    await c.query(
      `INSERT INTO notification_service.filas_email (destinatario, assunto, corpo, status)
       VALUES ($1,$2,$3,'PENDENTE')`,
      [params.email, subject, html]
    );
  });
    return sendMail(params.email, subject, '', html);
}

export async function processEmailQueue() {
  await withClient(async c => {
    const { rows } = await c.query(
      `SELECT * FROM notification_service.filas_email WHERE status='PENDENTE' ORDER BY data_envio LIMIT 10`
    );
    for (const email of rows) {
      try {
        await sendRegistrationEmail(email)
        await sendRegistrationEmail(email)
          await c.query(`UPDATE notification_service.filas_email SET status='ENVIADO' WHERE id=$1`, [email.id]);
        } catch (err) {
          console.error('[email][queue_send_fail]', { id: email.id, err: (err as Error).message });
          await c.query(`UPDATE notification_service.filas_email SET status='ERRO' WHERE id=$1`, [email.id]);
        }
      }
  });
}