require('dotenv').config();

const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

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
  const normalizedEmail = email.toLowerCase();

  const existing = await sequelize.query(
    'SELECT id FROM `User` WHERE email = :email LIMIT 1',
    {
      replacements: { email: normalizedEmail },
      type: QueryTypes.SELECT,
    }
  );

  if (existing.length > 0) {
    await sequelize.query(
      `UPDATE \`User\`
       SET password_hash = :passwordHash, is_admin = 1
       WHERE email = :email`,
      {
        replacements: { email: normalizedEmail, passwordHash },
      }
    );
  } else {
    await sequelize.query(
      `INSERT INTO \`User\` (email, password_hash, is_admin)
       VALUES (:email, :passwordHash, 1)`,
      {
        replacements: { email: normalizedEmail, passwordHash },
      }
    );
  }

  const [user] = await sequelize.query(
    'SELECT id, email, is_admin FROM `User` WHERE email = :email LIMIT 1',
    {
      replacements: { email: normalizedEmail },
      type: QueryTypes.SELECT,
    }
  );

  console.log('Admin user ready:', user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });