const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.error('[prisma] DATABASE_URL is not set — database will be unavailable');
}

const prisma = new PrismaClient();

module.exports = prisma;
