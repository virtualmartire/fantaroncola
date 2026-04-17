const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  user: env.db.user,
  host: env.db.host,
  database: env.db.name,
  password: env.db.password,
  port: env.db.port,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
