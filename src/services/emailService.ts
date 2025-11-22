import { withClient } from '../config/db.js'
import { buildPasswordTemplate } from '../templates/passwordTemplate.js'
import type {
  EmailRegistrationParams,
  EmailPasswordResetParams,
  EmailSendResult,
} from '../types/index.js'
import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function buildTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('smtp_nao_configurado')
  }
  const enableDebug = process.env.SMTP_DEBUG === 'true'
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    logger: enableDebug,
    debug: enableDebug,
  })
  if (enableDebug) {
    console.log('[email][transporter_created]', { host, port, user })
  }
  return transporter
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  // Sempre salvar na fila primeiro
  await withClient(async c => {
    await c.query(
      `INSERT INTO notification_service.filas_email (destinatario, assunto, corpo, status)
             VALUES ($1,$2,$3,'PENDENTE')`,
      [to, subject, html || text]
    )
  })

  const transporter = buildTransporter()

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: html || `<pre>${text}</pre>`,
    })

    const messageId = info.messageId || 'gmail-' + Date.now()

    // Marcar como enviado na fila
    await withClient(async c => {
      await c.query(
        `UPDATE notification_service.filas_email SET status='ENVIADO' 
                 WHERE destinatario=$1 AND assunto=$2 AND status='PENDENTE'`,
        [to, subject]
      )
    })

    console.log('[email][sent]', { to, subject, messageId, provider: 'gmail' })
    return { messageId, provider: 'gmail' }
  } catch (err) {
    console.error('[email][failed]', { to, subject, err: (err as Error).message })
    // Email fica na fila como PENDENTE para retry posterior
    throw err
  }
}

export async function sendRegistrationEmail(
  params: EmailRegistrationParams
): Promise<EmailSendResult> {
  const html = buildPasswordTemplate({ tipo: 'register', senha: params.senha })
  const subject = '🎓 Acesso Criado - NextLevel'
  const text = `Bem-vindo ao NextLevel! Sua senha é: ${params.senha}`

  console.log('[email][registration_attempt]', {
    to: params.email,
    senha: '***' + params.senha.slice(-3), // mostra só os 3 últimos dígitos
  })

  try {
    const result = await sendMail(params.email, subject, text, html)
    console.log('[email][registration_sent]', {
      to: params.email,
      messageId: result.messageId,
      provider: result.provider,
    })
    return result
  } catch (err) {
    console.error('[email][registration_failed]', { to: params.email, err: (err as Error).message })
    throw err
  }
}

export async function sendPasswordResetEmail(
  params: EmailPasswordResetParams
): Promise<EmailSendResult> {
  const html = buildPasswordTemplate({ tipo: 'reset', senha: params.novaSenha })
  const subject = '🔐 Senha Redefinida - NextLevel'
  const text = `Sua senha foi redefinida. Nova senha: ${params.novaSenha}`

  try {
    const result = await sendMail(params.email, subject, text, html)
    console.log('[email][reset_sent]', {
      to: params.email,
      messageId: result.messageId,
      provider: result.provider,
    })
    return result
  } catch (err) {
    console.error('[email][reset_failed]', { to: params.email, err: (err as Error).message })
    throw err
  }
}

export async function processEmailQueue() {
  await withClient(async c => {
    const { rows } = await c.query(
      `SELECT * FROM notification_service.filas_email WHERE status='PENDENTE' ORDER BY data_envio LIMIT 10`
    )

    if (rows.length === 0) {
      console.log('[email][queue_empty]')
      return
    }

    console.log(`[email][queue_processing] ${rows.length} emails pendentes`)

    for (const email of rows) {
      try {
        // Extrair texto simples do HTML para o SendGrid
        const text = email.corpo.replace(/<[^>]*>/g, '').trim() || 'Email do NextLevel'
        const result = await sendMail(email.destinatario, email.assunto, text, email.corpo)
        await c.query(`UPDATE notification_service.filas_email SET status='ENVIADO' WHERE id=$1`, [
          email.id,
        ])
        console.log('[email][queue_processed]', {
          id: email.id,
          to: email.destinatario,
          messageId: result.messageId,
          provider: result.provider,
        })
      } catch (err) {
        console.error('[email][queue_send_fail]', { id: email.id, err: (err as Error).message })
        await c.query(`UPDATE notification_service.filas_email SET status='ERRO' WHERE id=$1`, [
          email.id,
        ])
      }
    }
  })
}
