const { QueryTypes } = require('sequelize');
const sequelize = require('./sequelize');

async function resolveUser(req) {
  const email = req.header('x-user-email') || 'demo@sortmyscene.local';

  const [existing] = await sequelize.query(
    'SELECT id, email FROM `User` WHERE email = :email LIMIT 1',
    {
      replacements: { email },
      type: QueryTypes.SELECT,
    }
  );

  if (existing) {
    return existing;
  }

  const [result] = await sequelize.query(
    'INSERT INTO `User` (email) VALUES (:email)',
    {
      replacements: { email },
    }
  );

  return { id: result.insertId, email };
}

module.exports = { resolveUser };
