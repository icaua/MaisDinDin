import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const TRANSACTION_TYPES = ['IN', 'OUT'];

if (!JWT_SECRET) {
  console.error('ERRO FATAL: JWT_SECRET nao esta definida no .env.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function validarCPF(cpf) {
  if (!cpf) return false;

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i), 10) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i), 10) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpfLimpo.substring(10, 11), 10);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token nao fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalido ou expirado.' });
    }

    req.user = userPayload;
    return next();
  });
}

function formatDashboard(transactions) {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'IN') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpenses += transaction.amount;
      }

      if (!acc.summaryByCategory[transaction.category]) {
        acc.summaryByCategory[transaction.category] = {
          category: transaction.category,
          income: 0,
          expenses: 0,
          balance: 0,
        };
      }

      const categorySummary = acc.summaryByCategory[transaction.category];
      if (transaction.type === 'IN') {
        categorySummary.income += transaction.amount;
        categorySummary.balance += transaction.amount;
      } else {
        categorySummary.expenses += transaction.amount;
        categorySummary.balance -= transaction.amount;
      }

      return acc;
    },
    { totalIncome: 0, totalExpenses: 0, summaryByCategory: {} },
  );

  const balance = totals.totalIncome - totals.totalExpenses;
  const latestTransactions = transactions.slice(0, 5);
  const summaryByCategory = Object.values(totals.summaryByCategory);

  return {
    balance,
    totalIncome: totals.totalIncome,
    totalExpenses: totals.totalExpenses,
    latestTransactions,
    summaryByCategory,
    saldo: balance,
    totalReceitas: totals.totalIncome,
    totalDespesas: totals.totalExpenses,
    ultimasMovimentacoes: latestTransactions,
    resumoPorCategoria: summaryByCategory,
  };
}

app.post('/register', async (req, res) => {
  const { email, password, name, cpf } = req.body;

  if (!email || !password || !cpf) {
    return res.status(400).json({ success: false, message: 'Email, senha e CPF sao obrigatorios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  if (!validarCPF(cpfLimpo)) {
    return res.status(400).json({ success: false, message: 'CPF invalido.' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { cpf: cpfLimpo }] },
    });

    if (existingUser?.email === email) {
      return res.status(409).json({ success: false, message: 'Este email ja esta cadastrado.' });
    }

    if (existingUser?.cpf === cpfLimpo) {
      return res.status(409).json({ success: false, message: 'Este CPF ja esta cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, name, cpf: cpfLimpo },
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado com sucesso!',
      user: { id: newUser.id, email: newUser.email, name: newUser.name, cpf: newUser.cpf },
    });
  } catch (error) {
    console.error('Erro ao registrar usuario:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email ou CPF ja cadastrado.' });
    }

    return res.status(500).json({ success: false, message: 'Erro interno ao registrar usuario.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, message: 'Email e senha sao obrigatorios.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos.' });
    }

    const isMatch = await bcrypt.compare(senha, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos.' });
    }

    const userPayload = { userId: user.id, email: user.email, name: user.name };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      success: true,
      message: 'Login bem-sucedido!',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao tentar fazer login.' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, cpf: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado.' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    const dashboard = formatDashboard(transactions);

    return res.json({ success: true, user, saldo: dashboard.balance });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar dados do perfil.' });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { description, amount, category, type, date } = req.body;
  const parsedAmount = Number(amount);

  if (!description || amount === undefined || !category || !type || !date) {
    return res.status(400).json({
      success: false,
      message: 'description, amount, category, type e date sao obrigatorios.',
    });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'amount deve ser um numero maior que zero.' });
  }

  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: "type deve ser 'IN' ou 'OUT'." });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ success: false, message: 'date invalida.' });
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parsedAmount,
        category,
        type,
        date: parsedDate,
        userId: req.user.userId,
      },
    });

    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Erro ao criar transacao:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar transacao.' });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error('Erro ao listar transacoes:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar transacoes.' });
  }
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ success: true, ...formatDashboard(transactions) });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return res.status(500).json({ success: false, message: 'Erro ao carregar dashboard.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
