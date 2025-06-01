# 💰 Mais Dindin - Gerenciador Financeiro Pessoal

Bem-vindo ao Mais Dindin! Este é um projeto de aplicativo web desenvolvido para auxiliar no controle e gerenciamento de finanças pessoais.

## ✨ Sobre o Projeto

O objetivo do Mais Dindin é fornecer uma plataforma simples e intuitiva para que os usuários possam registrar suas receitas e despesas, categorizá-las e ter uma visão clara de sua saúde financeira.

**Estado Atual:** O projeto está em desenvolvimento. As funcionalidades de cadastro de usuário (com validação de CPF e senha segura), login com autenticação JWT e um painel inicial que exibe informações do perfil do usuário logado já estão implementadas.

## 🚀 Tecnologias Utilizadas

* **Backend:**
    * Node.js
    * Express.js
    * Prisma ORM com SQLite
    * JSON Web Tokens (JWT) para autenticação
    * bcryptjs para hashing de senhas
    * dotenv para variáveis de ambiente
* **Frontend:**
    * HTML5
    * CSS3 (com estilos customizados e Bootstrap 5)
    * JavaScript (Vanilla)

## 🛠️ Funcionalidades Implementadas
* Cadastro de novos usuários (Nome, Email, CPF com validação, Senha com hash).
* Login de usuários existentes.
* Autenticação e autorização baseada em JWT.
* Página Home que exibe o nome do usuário logado e um saldo (placeholder).
* Validação de CPF no lado do cliente e do servidor.
* Logout do sistema.

## 🏁 Como Rodar Localmente

### Pré-requisitos
* Node.js (versão 18.x ou superior recomendada)
* npm (geralmente vem com o Node.js)

### Backend
1.  Clone este repositório.
2.  Navegue até a pasta do backend: `cd meu-app-backend`
3.  Instale as dependências: `npm install`
4.  Crie um arquivo `.env` na raiz da pasta `meu-app-backend` e adicione as seguintes variáveis (substitua os valores conforme necessário):
    ```env
    DATABASE_URL="file:./prisma/dev.db"
    JWT_SECRET="SUA_CHAVE_SECRETA_MUITO_FORTE_AQUI"
    ```
5.  Execute as migrations do Prisma para criar o banco de dados: `npx prisma migrate dev`
6.  Inicie o servidor backend: `npm run dev` (ele estará rodando em `http://localhost:3000`)

### Frontend
1.  Abra os arquivos HTML (ex: `frontend/login.html`) diretamente no seu navegador.

---
