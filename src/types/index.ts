// Tipos para Notificações
export interface CreateNotificationData {
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo?: string;
  canal?: string;
}

export interface Notification {
  id: number;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: string | null;
  data_criacao: string;
  lida: boolean;
  canal: string | null;
}

export interface NotificationsPaginated {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Tipos para Templates
export interface NotificationTemplate {
  codigo: string;
  titulo: string;
  corpo: string;
  variaveis: string[];
  ativo: boolean;
  criado_em: string;
}

export interface TemplateVariables {
  [key: string]: string | number;
}

export interface CreateTemplateData {
  codigo: string;
  titulo: string;
  corpo: string;
  variaveis?: string[];
  ativo?: boolean;
}

// Tipos para Email Queue
export interface EmailQueueItem {
  id: number;
  destinatario: string;
  assunto: string;
  corpo: string;
  data_envio: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ERRO';
}

export interface EmailQueueStats {
  pendente: number;
  enviado: number;
  erro: number;
}

// Tipos para Email Templates
export interface EmailRegistrationParams {
  nome: string;
  email: string;
  senha: string;
}

export interface EmailPasswordResetParams {
  nome: string;
  email: string;
  novaSenha: string;
}

export interface EmailSendResult {
  messageId: string;
  provider: string;
}

// Tipos para Eventos (RabbitMQ)
export interface UserEvent {
  type: string;
  payload: {
    userId: string;
    email?: string;
    nome?: string;
    senha?: string;
    role?: string;
    timestamp?: string;
  };
}

export interface AuthEvent {
  type: string;
  payload: {
    userId: string;
    email?: string;
    nome?: string;
    senha?: string;
    timestamp?: string;
    ip?: string;
  };
}

// Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}