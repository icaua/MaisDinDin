import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'teste@maisdindin.com' },
    update: {},
    create: {
      name: 'Usuario Teste',
      email: 'teste@maisdindin.com',
      cpf: '52998224725',
      password,
    },
  });

  await prisma.transaction.deleteMany({
    where: { userId: user.id },
  });

  await prisma.transaction.createMany({
    data: [
      {
        description: 'Salario',
        amount: 3000,
        category: 'salario',
        type: 'IN',
        date: new Date('2026-05-01'),
        userId: user.id,
      },
      {
        description: 'Freelance',
        amount: 750,
        category: 'freelance',
        type: 'IN',
        date: new Date('2026-05-05'),
        userId: user.id,
      },
      {
        description: 'Aluguel',
        amount: 1200,
        category: 'moradia',
        type: 'OUT',
        date: new Date('2026-05-10'),
        userId: user.id,
      },
    ],
  });

  console.log('Seed criado com sucesso.');
  console.log(`Usuario: ${user.email}`);
  console.log('Senha: 123456');
  console.log('Saldo esperado: 2550');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
