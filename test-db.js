require('dotenv').config();
const sequelize = require('./lib/sequelize');
sequelize.authenticate().then(() => {
  console.log('DB ok');
}).catch(err => {
  console.error('DB ERR');
  console.error(err.message);
  process.exit(1);
});