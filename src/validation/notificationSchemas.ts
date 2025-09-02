import { z } from 'zod';
export const createNotificationSchema = z.object({ usuario_id:z.string().uuid(), titulo:z.string(), mensagem:z.string(), tipo:z.string().optional(), canal:z.string().optional() });
