export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Notification Service API',
    version: '1.0.0',
    description: 'Serviço de notificações in-app.'
  },
  tags: [
    {
      name: 'Notification - Notificações',
      description: 'Consulta e atualização de notificações in-app'
    }
  ],
  paths: {
    '/notifications/v1': {
      get: {
        summary: 'Buscar notificações do usuário autenticado',
        tags: ['Notification - Notificações'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'unread', in: 'query', schema: { type: 'boolean', default: false } }
        ],
        responses: {
          200: {
            description: 'Lista de notificações com paginação',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notifications: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Notification' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/v1/count': {
      get: {
        summary: 'Contar notificações não lidas',
        tags: ['Notification - Notificações'],
        responses: {
          200: {
            description: 'Número de notificações não lidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    unreadCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/v1/{id}/read': {
      put: {
        summary: 'Marcar notificação como lida',
        tags: ['Notification - Notificações'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'Notificação marcada como lida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          404: {
            description: 'Notificação não encontrada'
          }
        }
      }
    },
    '/notifications/v1/read-all': {
      put: {
        summary: 'Marcar todas notificações como lidas',
        tags: ['Notification - Notificações'],
        responses: {
          200: {
            description: 'Todas notificações marcadas como lidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    markedCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          funcionario_id: { type: 'string', format: 'uuid' },
          titulo: { type: 'string' },
          mensagem: { type: 'string' },
          tipo: { type: 'string', nullable: true },
          data_criacao: { type: 'string', format: 'date-time' },
          lida: { type: 'boolean' },
          canal: { type: 'string', nullable: true }
        }
      }
    }
  }
} as const;
