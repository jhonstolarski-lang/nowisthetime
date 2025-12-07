# 🚀 Guia de Deploy - Plataforma Lia Vasconcelos

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app)
- Conta no [Mercado Pago](https://www.mercadopago.com.br)
- Banco de dados MySQL/TiDB (Railway fornece gratuitamente)

## 🔧 Configuração no Railway

### 1. Criar Novo Projeto

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em "New Project"
3. Escolha "Deploy from GitHub repo" (ou faça upload manual do código)

### 2. Adicionar Banco de Dados MySQL

1. No seu projeto Railway, clique em "+ New"
2. Escolha "Database" → "MySQL"
3. Aguarde a criação do banco de dados
4. Copie a `DATABASE_URL` gerada (estará em "Variables")

### 3. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```bash
# Banco de Dados
DATABASE_URL=mysql://... (copiado do MySQL do Railway)

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET=sua_chave_secreta_aqui_min_32_caracteres

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1476621978161762-120701-329e6d73b23bebabfb63f55666454c0e-1060765649

# Node Environment
NODE_ENV=production

# Manus (opcional, pode deixar vazio se não usar OAuth)
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
OWNER_OPEN_ID=
OWNER_NAME=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# App Config
VITE_APP_TITLE=Plataforma Lia Vasconcelos
VITE_APP_LOGO=
```

### 4. Configurar Build e Start Commands

No Railway, configure:

**Build Command:**
```bash
pnpm install && pnpm db:push && pnpm build
```

**Start Command:**
```bash
pnpm start
```

### 5. Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Railway fornecerá uma URL pública (ex: `https://seu-app.railway.app`)

## 🗄️ Inicializar Banco de Dados

Após o primeiro deploy, você precisa criar a conta de administrador:

### Opção 1: Via Railway CLI

```bash
# Instale o Railway CLI
npm install -g @railway/cli

# Faça login
railway login

# Entre no projeto
railway link

# Execute o script
railway run node scripts/create-admin.mjs
```

### Opção 2: Manualmente via SQL

Conecte-se ao banco de dados MySQL do Railway e execute:

```sql
INSERT INTO users (email, passwordHash, name, role, loginMethod, createdAt, updatedAt, lastSignedIn)
VALUES (
  'eulilizinhah@gmail.com',
  'hash_da_senha_aqui', -- Use o hash gerado pelo script
  'Lia Vasconcelos',
  'admin',
  'email',
  NOW(),
  NOW(),
  NOW()
);
```

## 🔐 Configurar Webhook do Mercado Pago

1. Acesse o [Painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel/webhooks)
2. Clique em "Criar Webhook"
3. Configure:
   - **URL**: `https://seu-app.railway.app/api/trpc/subscription.handleWebhook`
   - **Eventos**: Selecione "Pagamentos"
4. Salve

## ✅ Testar a Aplicação

1. Acesse a URL do Railway
2. Crie uma conta de usuário
3. Faça login
4. Teste o fluxo de assinatura
5. Faça login como admin (eulilizinhah@gmail.com) para acessar o painel

## 📱 URLs Importantes

- **Homepage**: `https://seu-app.railway.app/`
- **Login**: `https://seu-app.railway.app/auth`
- **Assinatura**: `https://seu-app.railway.app/subscribe`
- **Conteúdo**: `https://seu-app.railway.app/content`
- **Admin**: `https://seu-app.railway.app/admin`

## 🐛 Troubleshooting

### Erro de Conexão com Banco de Dados

- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que o banco MySQL está rodando no Railway

### Erro no Mercado Pago

- Verifique se o `MERCADO_PAGO_ACCESS_TOKEN` está correto
- Teste primeiro com credenciais de teste antes de usar produção

### Erro de Build

- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o Node.js está na versão 18 ou superior

## 📞 Suporte

Para problemas ou dúvidas, entre em contato com o desenvolvedor.

---

**Desenvolvido com ❤️ para Lia Vasconcelos**
