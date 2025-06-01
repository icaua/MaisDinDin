// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não está definida no .env. Verifique o arquivo .env e reinicie o servidor.");
    process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function validarCPF(cpf) {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ success: false, message: 'Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            console.error("Erro na verificação do token:", err.message);
            return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
        }
        req.user = userPayload;
        next();
    });
}

app.post('/register', async (req, res) => {
    const { email, password, name, cpf } = req.body;

    if (!email || !password || !cpf) {
        return res.status(400).json({ success: false, message: 'Email, senha e CPF são obrigatórios.' });
    }

    const cpfLimpo = cpf.replace(/[^\d]+/g, '');
    if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ success: false, message: 'CPF inválido.' });
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: email }, { cpf: cpfLimpo }] },
        });

        if (existingUser) {
            if (existingUser.email === email) return res.status(409).json({ success: false, message: 'Este email já está cadastrado.' });
            if (existingUser.cpf === cpfLimpo) return res.status(409).json({ success: false, message: 'Este CPF já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword, name, cpf: cpfLimpo },
        });
        
        const userResponse = { id: newUser.id, email: newUser.email, name: newUser.name, cpf: newUser.cpf };
        res.status(201).json({ success: true, message: 'Usuário registrado com sucesso!', user: userResponse });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Email ou CPF já cadastrado (erro DB).' });
        res.status(500).json({ success: false, message: 'Erro interno ao registrar usuário.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ success: false, message: 'Email ou senha incorretos.' });

        const isMatch = await bcrypt.compare(senha, user.password);
        if (isMatch) {
            const userPayload = { userId: user.id, email: user.email, name: user.name };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
            res.json({ 
                success: true, 
                message: 'Login bem-sucedido!', 
                token, 
                user: { id: user.id, name: user.name, email: user.email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Email ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao tentar fazer login.' });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, email: true, name: true, cpf: true, createdAt: true }
        });
        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        
        // Lógica para calcular saldo real seria necessária aqui
        const saldoCalculado = 12345.67; // Placeholder
        res.json({ success: true, user, saldo: saldoCalculado });
    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar dados do perfil." });
    }
});

// Adicionar aqui futuras rotas para /api/transactions, /api/despesas, /api/receitas, etc.
// Todas protegidas com o middleware `authenticateToken`

app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});