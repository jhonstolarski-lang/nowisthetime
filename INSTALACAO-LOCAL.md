# 💻 Guia de Instalação Local - Plataforma Lia Vasconcelos

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado na sua máquina:

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verifique a instalação: `node --version`

2. **pnpm** (gerenciador de pacotes)
   - Instale com: `npm install -g pnpm`
   - Verifique a instalação: `pnpm --version`

3. **MySQL** (banco de dados)
   - Opção 1: Instalar localmente (https://dev.mysql.com/downloads/)
   - Opção 2: Usar banco de dados online gratuito:
     - [PlanetScale](https://planetscale.com/) (recomendado)
     - [Railway](https://railway.app/)
     - [Aiven](https://aiven.io/)

## 🚀 Passo a Passo

### 1. Baixar o Projeto

Você já deve ter baixado o arquivo `lia-vasconcelos-platform-v3.tar.gz`.

Extraia o arquivo:
```bash
# No Windows (use 7-Zip ou WinRAR)
# Clique com botão direito > Extrair aqui

# No Mac/Linux
tar -xzf lia-vasconcelos-platform-v3.tar.gz
```

### 2. Entrar na Pasta do Projeto

```bash
cd lia-vasconcelos-platform-v3
```

### 3. Instalar Dependências

```bash
pnpm install
```

Este comando vai baixar todas as bibliotecas necessárias (pode demorar alguns minutos).

### 4. Configurar Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```bash
# Banco de Dados (substitua pela sua conexão MySQL)
DATABASE_URL=mysql://usuario:senha@localhost:3306/lia_vasconcelos

# JWT Secret (pode deixar este valor para teste local)
JWT_SECRET=minha_chave_secreta_super_segura_123456789

# Mercado Pago (seu token)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1476621978161762-120701-329e6d73b23bebabfb63f55666454c0e-1060765649

# Ambiente
NODE_ENV=development

# Configurações do App
VITE_APP_TITLE=Plataforma Lia Vasconcelos
VITE_APP_LOGO=

# Variáveis Manus (deixe vazio para teste local)
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
```

**⚠️ IMPORTANTE:** Substitua a `DATABASE_URL` pela conexão do seu banco de dados MySQL.

#### Como obter a DATABASE_URL:

**Opção A - MySQL Local:**
```
DATABASE_URL=mysql://root:sua_senha@localhost:3306/lia_vasconcelos
```

**Opção B - PlanetScale (Grátis):**
1. Crie uma conta em https://planetscale.com/
2. Crie um novo banco de dados
3. Copie a "Connection String" no formato MySQL
4. Cole no `.env`

**Opção C - Railway (Grátis):**
1. Crie uma conta em https://railway.app/
2. Crie um novo projeto
3. Adicione MySQL
4. Copie a `DATABASE_URL` das variáveis
5. Cole no `.env`

### 5. Criar as Tabelas no Banco de Dados

```bash
pnpm db:push
```

Este comando vai criar automaticamente todas as tabelas necessárias (users, subscriptions, content).

### 6. Criar a Conta de Administrador

```bash
npx tsx scripts/create-admin.mjs
```

Isso vai criar a conta:
- **Email:** eulilizinhah@gmail.com
- **Senha:** eulilis123

### 7. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

Aguarde a mensagem:
```
Server running on http://localhost:3000/
```

### 8. Acessar a Plataforma

Abra seu navegador e acesse:

- **Homepage:** http://localhost:3000/
- **Login:** http://localhost:3000/auth
- **Assinatura:** http://localhost:3000/subscribe
- **Conteúdo:** http://localhost:3000/content
- **Admin:** http://localhost:3000/admin

### 9. Fazer Login como Admin

1. Acesse http://localhost:3000/auth
2. Entre com:
   - Email: eulilizinhah@gmail.com
   - Senha: eulilis123
3. Você terá acesso ao painel de administração

## 🎨 Adicionar Conteúdo

1. Faça login como admin
2. Acesse http://localhost:3000/admin
3. Na aba "Conteúdo", preencha o formulário:
   - **Título:** Nome do conteúdo
   - **Descrição:** Breve descrição
   - **URL:** Link para o vídeo/documento (YouTube, Google Drive, etc.)
   - **Tipo:** Escolha entre Vídeo, Documento, Imagem ou Outro
   - **Público:** Marque se quiser que seja visível sem assinatura
4. Clique em "Criar Conteúdo"

## 🧪 Testar Assinatura

1. Crie uma conta de usuário normal (não admin)
2. Acesse a página de assinatura
3. Escolha um plano
4. Um código Pix será gerado
5. **ATENÇÃO:** Use o token de **TESTE** do Mercado Pago para não gerar cobranças reais!

## 🐛 Problemas Comuns

### Erro: "Cannot connect to database"
- Verifique se o MySQL está rodando
- Verifique se a `DATABASE_URL` está correta no `.env`
- Teste a conexão com: `mysql -u usuario -p`

### Erro: "Port 3000 already in use"
- Outra aplicação está usando a porta 3000
- Feche o outro programa ou mude a porta no código

### Erro: "pnpm: command not found"
- Instale o pnpm: `npm install -g pnpm`

### Erro ao criar tabelas
- Delete o banco de dados e crie novamente
- Execute `pnpm db:push` novamente

## 📞 Suporte

Se tiver qualquer problema, me avise que eu te ajudo!

---

**Desenvolvido com ❤️ para Lia Vasconcelos**
