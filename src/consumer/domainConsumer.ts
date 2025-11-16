import { ConsumeMessage } from 'amqplib';
import { connectRabbitMQ } from '../config/rabbitmq.js';
import { createNotificationFromTemplate } from '../services/templateService.js';
import { getAuthUserIdByFuncionarioId } from '../services/notificationService.js';

const EXCHANGE_PROGRESS = process.env.EXCHANGE_PROGRESS || 'progress.events';
const EXCHANGE_ASSESSMENT = process.env.EXCHANGE_ASSESSMENT || 'assessment.events';
const EXCHANGE_GAMIFICATION = process.env.EXCHANGE_GAMIFICATION || 'gamification.events';
const QUEUE_NOTIFICATION_ACTIVITY = process.env.QUEUE_NOTIFICATION_ACTIVITY || 'notification.activity';

const EXCHANGE_BINDINGS = [
  {
    exchange: EXCHANGE_PROGRESS,
    type: 'direct' as const,
    routingKeys: [
      'progress.module.completed.v1',
      'progress.course.completed.v1',
      'progress.certificate.issued.v1'
    ]
  },
  {
    exchange: EXCHANGE_ASSESSMENT,
    type: 'direct' as const,
    routingKeys: ['assessment.passed.v1', 'assessment.failed.v1']
  },
  {
    exchange: EXCHANGE_GAMIFICATION,
    type: 'direct' as const,
    routingKeys: ['gamification.badge.awarded.v1']
  }
];

interface ServiceEvent<TPayload = Record<string, unknown>> {
  type: string;
  payload: TPayload;
  emittedAt?: string;
}

interface ModuleCompletedPayload {
  userId: string;
  moduleId?: string;
  courseId?: string;
  xpEarned?: number;
  progressPercent?: number;
}

interface CourseCompletedPayload {
  userId: string;
  courseId?: string;
  totalProgress?: number;
}

interface AssessmentPayload {
  userId: string;
  assessmentCode?: string;
  courseId?: string;
  score?: number;
}

interface CertificatePayload {
  userId: string;
  courseId?: string;
  certificateCode?: string;
}

interface BadgePayload {
  userId: string;
  badgeCode?: string;
  badgeName?: string;
  badgeDescription?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBindings(channel: any) {
  await channel.assertQueue(QUEUE_NOTIFICATION_ACTIVITY, { durable: true });

  for (const binding of EXCHANGE_BINDINGS) {
    await channel.assertExchange(binding.exchange, binding.type, { durable: true });
    for (const key of binding.routingKeys) {
      await channel.bindQueue(QUEUE_NOTIFICATION_ACTIVITY, binding.exchange, key);
    }
  }
}

async function handleProgressModule(event: ServiceEvent<ModuleCompletedPayload>) {
  const payload = event.payload;
  if (!payload?.userId) return;

  const authUserId = await getAuthUserIdByFuncionarioId(payload.userId);
  if (!authUserId) return;

  await createNotificationFromTemplate(
    'progress_module_completed',
    authUserId,
    {
      modulo_id: payload.moduleId ?? '',
      curso_id: payload.courseId ?? '',
      xp_ganho: payload.xpEarned ?? 0,
      progresso_percentual: payload.progressPercent ?? 0
    },
    'progress_update',
    'app'
  );
}

async function handleProgressCourse(event: ServiceEvent<CourseCompletedPayload>) {
  const payload = event.payload;
  if (!payload?.userId) return;

  const authUserId = await getAuthUserIdByFuncionarioId(payload.userId);
  if (!authUserId) return;

  await createNotificationFromTemplate(
    'progress_course_completed',
    authUserId,
    {
      curso_id: payload.courseId ?? '',
      progresso_total: payload.totalProgress ?? 100
    },
    'progress_update',
    'app'
  );
}

async function handleAssessment(event: ServiceEvent<AssessmentPayload>, template: 'assessment_passed' | 'assessment_failed') {
  const payload = event.payload;
  if (!payload?.userId) return;

  const authUserId = await getAuthUserIdByFuncionarioId(payload.userId);
  if (!authUserId) return;

  await createNotificationFromTemplate(
    template,
    authUserId,
    {
      avaliacao_codigo: payload.assessmentCode ?? '',
      curso_id: payload.courseId ?? '',
      nota: payload.score ?? 0
    },
    'assessment_update',
    'app'
  );
}

async function handleCertificate(event: ServiceEvent<CertificatePayload>) {
  const payload = event.payload;
  if (!payload?.userId) return;

  const authUserId = await getAuthUserIdByFuncionarioId(payload.userId);
  if (!authUserId) return;

  await createNotificationFromTemplate(
    'certificate_issued',
    authUserId,
    {
      curso_id: payload.courseId ?? '',
      codigo_certificado: payload.certificateCode ?? ''
    },
    'certificate',
    'app'
  );
}

async function handleBadge(event: ServiceEvent<BadgePayload>) {
  const payload = event.payload;
  if (!payload?.userId) return;

  const authUserId = await getAuthUserIdByFuncionarioId(payload.userId);
  if (!authUserId) return;

  await createNotificationFromTemplate(
    'badge_awarded',
    authUserId,
    {
      badge_codigo: payload.badgeCode ?? '',
      badge_nome: payload.badgeName ?? payload.badgeCode ?? '',
      badge_descricao: payload.badgeDescription ?? ''
    },
    'gamification_update',
    'app'
  );
}

export async function startDomainConsumer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel: any = await connectRabbitMQ();
  await assertBindings(channel);

  channel.consume(QUEUE_NOTIFICATION_ACTIVITY, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString()) as ServiceEvent;
      switch (event.type) {
        case 'progress.module.completed.v1':
          await handleProgressModule(event as unknown as ServiceEvent<ModuleCompletedPayload>);
          break;
        case 'progress.course.completed.v1':
          await handleProgressCourse(event as unknown as ServiceEvent<CourseCompletedPayload>);
          break;
        case 'progress.certificate.issued.v1':
          await handleCertificate(event as unknown as ServiceEvent<CertificatePayload>);
          break;
        case 'assessment.passed.v1':
          await handleAssessment(event as unknown as ServiceEvent<AssessmentPayload>, 'assessment_passed');
          break;
        case 'assessment.failed.v1':
          await handleAssessment(event as unknown as ServiceEvent<AssessmentPayload>, 'assessment_failed');
          break;
        case 'gamification.badge.awarded.v1':
          await handleBadge(event as unknown as ServiceEvent<BadgePayload>);
          break;
        default:
          console.log(`[notification-service] Evento de atividade ignorado: ${event.type}`);
      }

      channel.ack(msg);
    } catch (error) {
      console.error('[notification-service] Erro processando evento de atividade:', error);
      channel.nack(msg, false, false);
    }
  });
}
