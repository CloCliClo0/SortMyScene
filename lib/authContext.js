const prisma = require('./prisma');

async function resolveUser(req) {
  const email = req.header('x-user-email') || 'demo@sortmyscene.local';

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}

module.exports = { resolveUser };
