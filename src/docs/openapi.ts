export const openapiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "Notification Service API",
    "version": "1.0.0",
    "description": "Serviço de notificações in-app com templates inteligentes e fila de emails."
  },
  "paths": {
    "/api/v1/notifications/templates": {
      "get": {
        "summary": "Listar templates de notificação",
        "tags": ["templates"],
        "responses": {
          "200": {
            "description": "Lista de templates disponíveis",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/NotificationTemplate"}
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Criar/atualizar template de notificação",
        "tags": ["templates"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["codigo", "titulo", "corpo"],
                "properties": {
                  "codigo": {"type": "string", "description": "Código único do template"},
                  "titulo": {"type": "string", "description": "Título da notificação"},
                  "corpo": {"type": "string", "description": "Corpo da mensagem com variáveis {nome}"},
                  "variaveis": {"type": "array", "items": {"type": "string"}, "description": "Lista de variáveis disponíveis"},
                  "ativo": {"type": "boolean", "default": true}
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Template criado/atualizado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/NotificationTemplate"}
              }
            }
          }
        }
      }
    },
    "/api/v1/notifications/templates/{codigo}": {
      "get": {
        "summary": "Buscar template por código",
        "tags": ["templates"],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "responses": {
          "200": {
            "description": "Template encontrado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/NotificationTemplate"}
              }
            }
          },
          "404": {
            "description": "Template não encontrado"
          }
        }
      }
    },
    "/api/v1/notifications/templates/{codigo}/send": {
      "post": {
        "summary": "Enviar notificação usando template",
        "tags": ["templates"],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["usuario_id"],
                "properties": {
                  "usuario_id": {"type": "string", "format": "uuid"},
                  "variables": {"type": "object", "description": "Variáveis para substituir no template"},
                  "tipo": {"type": "string"},
                  "canal": {"type": "string", "default": "app"}
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Notificação enviada",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {"type": "integer"},
                    "titulo": {"type": "string"},
                    "mensagem": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/email/queue": {
      "get": {
        "summary": "Listar fila de emails",
        "tags": ["email"],
        "responses": {
          "200": {
            "description": "Status da fila de emails",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/EmailQueue"}
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/email/queue/{id}/retry": {
      "post": {
        "summary": "Retentar envio de email",
        "tags": ["email"],
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
    "/api/v1/notifications": {
      "get": {
        "summary": "Buscar notificações do usuário autenticado",
        "tags": ["notifications"],
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
        "summary": "Criar nova notificação direta (admin only)",
        "tags": ["notifications"],
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
    "/api/v1/notifications/count": {
      "get": {
        "summary": "Contar notificações não lidas",
        "tags": ["notifications"],
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
    "/api/v1/notifications/{id}/read": {
      "put": {
        "summary": "Marcar notificação como lida",
        "tags": ["notifications"],
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
    "/api/v1/notifications/read-all": {
      "put": {
        "summary": "Marcar todas notificações como lidas",
        "tags": ["notifications"],
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
      },
      "NotificationTemplate": {
        "type": "object",
        "properties": {
          "codigo": {"type": "string"},
          "titulo": {"type": "string"},
          "corpo": {"type": "string"},
          "variaveis": {"type": "array", "items": {"type": "string"}},
          "ativo": {"type": "boolean"},
          "criado_em": {"type": "string", "format": "date-time"}
        }
      },
      "EmailQueue": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "destinatario": {"type": "string"},
          "assunto": {"type": "string"},
          "corpo": {"type": "string"},
          "data_envio": {"type": "string", "format": "date-time"},
          "status": {"type": "string", "enum": ["PENDENTE", "ENVIADO", "ERRO"]}
        }
      }
    }
  }
} as const;