require('dotenv').config();

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

function getEnvValue(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

async function main() {
  const email = getEnvValue('ADMIN_EMAIL') || 'admin@sortmyscene.fr';
  const password = getEnvValue('ADMIN_PASSWORD') || 'ChangeMe123!';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined or fall back to defaults.');
  }

  if (password.length < 6) {
    throw new Error('Admin password must be at least 6 characters long.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password_hash: passwordHash,
      is_admin: true,
    },
    create: {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      is_admin: true,
    },
    select: {
      id: true,
      email: true,
      is_admin: true,
    },
  });

  console.log('Admin user ready:', user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });