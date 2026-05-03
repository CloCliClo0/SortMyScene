require('dotenv').config();
const { URL } = require('url');
const sequelize = require('./lib/sequelize');

const databaseUrl = process.env.DATABASE_URL;
console.log('[test-db] DATABASE_URL=', databaseUrl ? databaseUrl.replace(/(mysql:\/\/[^:]+):.*@/, '$1:***@') : 'undefined');
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    console.log('[test-db] parsed host=', parsed.hostname);
    console.log('[test-db] parsed port=', parsed.port);
    console.log('[test-db] parsed database=', parsed.pathname.slice(1));
  } catch (parseError) {
    console.error('[test-db] parse error=', parseError.message);
  }
}

sequelize.authenticate().then(() => {
  console.log('DB ok');
}).catch(err => {
  console.error('DB ERR');
  console.error(err.message);
  console.error(err);
  process.exit(1);
});