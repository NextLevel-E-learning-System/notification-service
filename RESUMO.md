# Resumo do Notification Service

## 📋 Visão Geral
O **Notification Service** é um microserviço de notificações desenvolvido em **TypeScript** com **Node.js** e **Express**, parte do sistema NextLevel E-learning. Ele gerencia notificações in-app, envia emails e consome eventos de outros serviços através do RabbitMQ.

## 🏗️ Arquitetura

### Tecnologias Principais
- **Node.js 22** com TypeScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados para armazenar notificações
- **RabbitMQ (amqplib)** - Sistema de mensageria para consumo de eventos
- **Pino** - Logger estruturado
- **Zod** - Validação de schemas
- **Swagger UI** - Documentação da API

### Estrutura do Projeto
```
src/
├── config/          # Configurações (DB, RabbitMQ, Logger, OpenAPI)
├── consumer/        # Consumidores de eventos RabbitMQ
├── controllers/     # Controladores HTTP
├── routes/          # Rotas da API
├── services/        # Lógica de negócio
├── templates/       # Templates de notificações
├── middleware/      # Middlewares (error handler)
├── types/           # Tipos TypeScript
├── utils/           # Utilitários
├── docs/            # Documentação OpenAPI
├── server.ts        # Configuração do servidor Express
└── index.ts         # Ponto de entrada da aplicação
```

## 🔄 Funcionalidades Principais

### 1. API REST de Notificações
Endpoints disponíveis em `/notifications/v1`:
- **GET /** - Lista notificações do usuário (com paginação)
- **GET /count** - Conta notificações não lidas
- **PUT /:id/read** - Marca notificação específica como lida
- **PUT /read-all** - Marca todas as notificações como lidas

### 2. Consumidores de Eventos RabbitMQ

#### User Consumer (`userConsumer.ts`)
Consome eventos do exchange `user.events`:
- **user.created** - Envia email de boas-vindas e cria notificação
- **user.password_reset** - Envia email com nova senha e cria notificação
- **user.role_changed** - Cria notificação de mudança de perfil
- **user.updated** - Cria notificação de atualização de perfil

#### Domain Consumer (`domainConsumer.ts`)
Consome eventos de outras áreas do sistema (cursos, turmas, etc.)

### 3. Serviços

#### Notification Service
- Cria notificações in-app no banco de dados
- Busca notificações com paginação
- Marca notificações como lidas
- Remove notificações antigas (> 90 dias)

#### Email Service
- Envia emails de registro de usuário
- Envia emails de reset de senha
- Usa templates HTML para formatação

#### Template Service
- Gerencia templates de notificações (welcome, password_reset, role_change, profile_update)
- Substitui variáveis nos templates
- Cria notificações a partir de templates predefinidos

## 🗄️ Banco de Dados
Utiliza PostgreSQL com schema `notification_service`:
- Tabela `notificacoes` para armazenar notificações
- Referência ao schema `user_service` para dados de funcionários

## 🚀 Como Executar

### Desenvolvimento
```bash
npm install
npm run dev        # Inicia com hot reload
```

### Produção
```bash
npm run build      # Compila TypeScript
npm start          # Inicia aplicação compilada
```

### Docker
```bash
docker build -t notification-service .
docker run -p 3333:3333 notification-service
```

### Linting e Formatação
```bash
npm run lint       # Verifica código
npm run lint:fix   # Corrige problemas automaticamente
npm run format     # Formata código com Prettier
```

## 🔐 Variáveis de Ambiente
O serviço utiliza variáveis de ambiente para configuração:
- `PORT` - Porta do servidor (padrão: 3333)
- `DATABASE_URL` - URL de conexão PostgreSQL
- `RABBITMQ_URL` - URL de conexão RabbitMQ
- `EXCHANGE_USER` - Nome do exchange de usuários
- `EXCHANGE_AUTH` - Nome do exchange de autenticação
- `QUEUE_NOTIFICATION_USER` - Fila de notificações de usuários
- `CORS_ORIGINS` - Origens permitidas para CORS
- `ALLOW_ALL_ORIGINS` - Permite todas as origens (desenvolvimento)

## 📊 Fluxo de Notificações

1. **Evento Publicado** - Outro serviço publica evento no RabbitMQ
2. **Consumidor Processa** - Consumer escuta e processa o evento
3. **Template Aplicado** - Template Service substitui variáveis
4. **Notificação Criada** - Salva no banco de dados
5. **Email Enviado** (opcional) - Para eventos específicos
6. **API Retorna** - Frontend busca notificações via API REST

## 🎯 Pontos Fortes
- ✅ Arquitetura baseada em eventos (event-driven)
- ✅ Desacoplamento entre serviços via RabbitMQ
- ✅ Sistema de templates reutilizáveis
- ✅ API RESTful bem estruturada
- ✅ Documentação OpenAPI/Swagger
- ✅ Logger estruturado com Pino
- ✅ Validação de schemas com Zod
- ✅ TypeScript para type safety
- ✅ Containerização com Docker
- ✅ Limpeza automática de notificações antigas

## 📝 Observações
- Sistema parte de uma arquitetura de microserviços
- Integração com `user-service` e `auth-service`
- Notificações baseadas em `funcionario_id` (ID do usuário)
- Suporte a múltiplos canais (app, email)
- Sistema de paginação para performance

---

**Versão:** 0.1.0  
**Licença:** Private  
**Organização:** NextLevel E-learning System
