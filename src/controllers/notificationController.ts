import { Request, Response, NextFunction } from 'express';
import { listNotifications, createNotification } from '../services/notificationService.js';
import { createNotificationSchema } from '../validation/notificationSchemas.js';
import { HttpError } from '../utils/httpError.js';
export async function listNotificationsHandler(req:Request,res:Response,next:NextFunction){ try { const r= await listNotifications(req.header('x-user-id')||undefined); res.json(r);} catch(e){ next(e);} }
export async function createNotificationHandler(req:Request,res:Response,next:NextFunction){ const parsed=createNotificationSchema.safeParse(req.body); if(!parsed.success) return next(new HttpError(400,'validation_error',parsed.error.issues)); try { const r= await createNotification(parsed.data); res.status(201).json(r);} catch(e){ next(e);} }
