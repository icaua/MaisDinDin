# Mais Dindin

Aplicacao web simples para controle financeiro pessoal.

## Tecnologias

- Node.js
- Express
- Prisma ORM
- SQLite
- JWT
- bcryptjs
- HTML, CSS e JavaScript vanilla

## Como rodar o backend

Entre na pasta do backend:

```bash
cd backEnd
```

Instale as dependencias:

```bash
npm install
```

Crie um arquivo `.env` dentro de `backEnd`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque_por_uma_chave_segura"
```

Rode as migrations do Prisma:

```bash
npx prisma migrate dev
```

Gere o Prisma Client, se necessario:

```bash
npx prisma generate
```

Opcionalmente, rode o seed:

```bash
node seed.js
```

Inicie o servidor:

```bash
npm run dev
```

O backend ficara disponivel em `http://localhost:3000`.

## Como abrir o frontend

Abra o arquivo `frontend/login.html` no navegador.

Fluxo esperado:

1. Cadastre uma conta em `frontend/register.html`.
2. Faca login em `frontend/login.html`.
3. Acesse a home.
4. Registre receitas e despesas.
5. Veja saldo e ultimas movimentacoes atualizadas.

## Rotas disponiveis

### Autenticacao

- `POST /register`: cadastra usuario com nome, email, CPF e senha.
- `POST /login`: autentica usuario e retorna token JWT.
- `GET /api/profile`: retorna dados do usuario logado.

### Financeiro

- `POST /api/transactions`: cria receita ou despesa para o usuario logado.
- `GET /api/transactions`: lista transacoes do usuario logado.
- `GET /api/dashboard`: retorna saldo, receitas, despesas, ultimas movimentacoes e resumo por categoria.

## Observacoes

- As rotas financeiras exigem header `Authorization: Bearer <token>`.
- O frontend nao envia `userId`; o backend identifica o usuario pelo token JWT.
- O tipo da transacao deve ser `IN` para receita ou `OUT` para despesa.
