const { Sequelize } = require('sequelize');
const { URL } = require('url');

function createMissingDatabaseUrlError() {
  const error = new Error('DATABASE_URL not configured');
  error.code = 'NO_DATABASE_URL';
  return error;
}

function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null;

  try {
    const parsed = new URL(databaseUrl);
    return {
      dialect: parsed.protocol.replace(':', ''),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : undefined,
      database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
      dialectOptions: {
        connectTimeout: Number(process.env.DB_TIMEOUT_MS) || 8000,
      },
      logging: false,
    };
  } catch (error) {
    console.error('[sequelize] Invalid DATABASE_URL:', error.message);
    return null;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('[sequelize] DATABASE_URL is not set - database will be unavailable');
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(parseDatabaseUrl(process.env.DATABASE_URL))
  : {
      authenticate: () => Promise.reject(createMissingDatabaseUrlError()),
      query: () => Promise.reject(createMissingDatabaseUrlError()),
      transaction: () => Promise.reject(createMissingDatabaseUrlError()),
      close: () => Promise.resolve(),
    };

module.exports = sequelize;
