const { Sequelize } = require('sequelize');

function createMissingDatabaseUrlError() {
  const error = new Error('DATABASE_URL not configured');
  error.code = 'NO_DATABASE_URL';
  return error;
}

if (!process.env.DATABASE_URL) {
  console.error('[sequelize] DATABASE_URL is not set - database will be unavailable');
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        connectTimeout: Number(process.env.DB_TIMEOUT_MS) || 8000,
      },
    })
  : {
      authenticate: () => Promise.reject(createMissingDatabaseUrlError()),
      query: () => Promise.reject(createMissingDatabaseUrlError()),
      transaction: () => Promise.reject(createMissingDatabaseUrlError()),
      close: () => Promise.resolve(),
    };

module.exports = sequelize;
