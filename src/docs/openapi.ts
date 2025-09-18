export const openapiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "Notification Service API",
    "version": "1.0.0",
    "description": "Serviço de notificações com templates, filas e notificações."
  },
  "paths": {
    "/notifications/v1/templates": {
      "get": {
        "summary": "Listar templates",
        "tags": ["templates"],
        "responses": {
          "200": {
            "description": "Lista de templates"
          }
        }
      },
      "post": {
        "summary": "Criar template",
        "tags": ["templates"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["nome", "assunto", "corpo"],
                "properties": {
                  "nome": {"type": "string"},
                  "assunto": {"type": "string"},
                  "corpo": {"type": "string"}
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Template criado"
          }
        }
      }
    },
    "/notifications/v1/filas": {
      "get": {
        "summary": "Listar fila de emails",
        "tags": ["filas"],
        "responses": {
          "200": {
            "description": "Status da fila"
          }
        }
      }
    },
    "/notifications/v1/filas/{id}/retry": {
      "post": {
        "summary": "Retentar envio de email",
        "tags": ["filas"],
        "parameters": [
          {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "responses": {
          "200": {
            "description": "Reenvio executado"
          }
        }
      }
    },
    "/notifications/v1/notificacoes": {
      "get": {
        "summary": "Buscar notificações do usuário autenticado",
        "tags": ["notificacoes"],
        "parameters": [
          {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
          {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 20}},
          {"name": "unread", "in": "query", "schema": {"type": "boolean", "default": false}}
        ],
        "responses": {
          "200": {
            "description": "Lista de notificações com paginação",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "notifications": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/Notification"}
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "page": {"type": "integer"},
                        "limit": {"type": "integer"},
                        "total": {"type": "integer"}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Criar nova notificação (admin only)",
        "tags": ["notificacoes"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["usuario_id", "titulo", "mensagem"],
                "properties": {
                  "usuario_id": {"type": "string", "format": "uuid"},
                  "titulo": {"type": "string"},
                  "mensagem": {"type": "string"},
                  "tipo": {"type": "string"},
                  "canal": {"type": "string", "default": "app"}
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Notificação criada",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Notification"}
              }
            }
          }
        }
      }
    },
    "/notifications/v1/notificacoes/count": {
      "get": {
        "summary": "Contar notificações não lidas",
        "tags": ["notificacoes"],
        "responses": {
          "200": {
            "description": "Número de notificações não lidas",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "unreadCount": {"type": "integer"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/notifications/v1/notificacoes/{id}/read": {
      "put": {
        "summary": "Marcar notificação como lida",
        "tags": ["notificacoes"],
        "parameters": [
          {"name": "id", "in": "path", "required": true, "schema": {"type": "integer"}}
        ],
        "responses": {
          "200": {
            "description": "Notificação marcada como lida"
          },
          "404": {
            "description": "Notificação não encontrada"
          }
        }
      }
    },
    "/notifications/v1/notificacoes/read-all": {
      "put": {
        "summary": "Marcar todas notificações como lidas",
        "tags": ["notificacoes"],
        "responses": {
          "200": {
            "description": "Todas notificações marcadas como lidas",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {"type": "string"},
                    "markedCount": {"type": "integer"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/notifications/v1/notificacoes/{usuarioId}": {
      "get": {
        "summary": "Listar notificações do usuário (rota legada)",
        "tags": ["notificacoes"],
        "parameters": [
          {"name": "usuarioId", "in": "path", "required": true, "schema": {"type": "string", "format": "uuid"}}
        ],
        "responses": {
          "200": {
            "description": "Lista de notificações do usuário"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Notification": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "usuario_id": {"type": "string", "format": "uuid"},
          "titulo": {"type": "string"},
          "mensagem": {"type": "string"},
          "tipo": {"type": "string", "nullable": true},
          "data_criacao": {"type": "string", "format": "date-time"},
          "lida": {"type": "boolean"},
          "canal": {"type": "string", "nullable": true}
        }
      }
    }
  }
} as const;