import { withClient } from '../config/db.js'
import { buildPasswordTemplate } from '../templates/passwordTemplate.js'
import type {
  EmailRegistrationParams,
  EmailPasswordResetParams,
  EmailSendResult,
} from '../types/index.js'

// Configuração SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'nextlevel.elearning@gmail.com'

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY não configurada no .env')
  }

  // Sempre salvar na fila primeiro
  await withClient(async c => {
    await c.query(
      `INSERT INTO notification_service.filas_email (destinatario, assunto, corpo, status)
             VALUES ($1,$2,$3,'PENDENTE')`,
      [to, subject, html || text]
    )
  })

  // Envio via SendGrid API
  const sgData = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject,
      },
    ],
    from: { email: SENDGRID_FROM_EMAIL },
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html || `<pre>${text}</pre>` },
    ],
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sgData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SendGrid error ${response.status}: ${errorText}`)
    }

    const messageId = response.headers.get('x-message-id') || 'sendgrid-' + Date.now()

    // Marcar como enviado na fila
    await withClient(async c => {
      await c.query(
        `UPDATE notification_service.filas_email SET status='ENVIADO' 
                 WHERE destinatario=$1 AND assunto=$2 AND status='PENDENTE'`,
        [to, subject]
      )
    })

    console.log('[email][sent]', { to, subject, messageId, status: response.status })
    return { messageId, provider: 'sendgrid' }
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
  const text = `Bem-vindo ao NextLevel! Sua senha temporária é: ${params.senha}`

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
