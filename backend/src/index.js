const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const RedisStore = require('connect-redis').RedisStore;
const { createClient } = require('redis');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const app = express();
const db = require('./config/db');
const env = require('./config/env');
const { syncPointsFromCsv } = require('./utils/syncPoints');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getSeedKey = (singer, index) => singer.seed_key || `slot-${index + 1}`;
const getLegacyPlaceholderName = (index) => `Singer ${String.fromCharCode(65 + index)}`;
const getSingerSearchNames = (singer) => {
  return Array.from(new Set([singer.name, ...(singer.legacy_names || [])]));
};
const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');
const allowedOrigins = new Set(env.allowedOrigins.map(normalizeOrigin));
let appConfigured = false;
const resolveCorsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (!allowedOrigins.size || allowedOrigins.has(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  callback(new Error('Origin not allowed by CORS'));
};
const buildSessionStore = async () => {
  if (!env.redisUrl) {
    return undefined;
  }

  const redisClient = createClient({
    url: env.redisUrl,
  });

  redisClient.on('error', (error) => {
    console.error('Redis client error:', error.message);
  });

  await redisClient.connect();

  return new RedisStore({
    client: redisClient,
    prefix: 'fantaroncola:',
  });
};
const ensureAdminUser = async () => {
  const adminUsername = env.adminUsername;
  const adminPassword = env.adminPassword;

  if (!adminUsername || !adminPassword) {
    console.log('Admin bootstrap skipped: missing ADMIN_USERNAME or ADMIN_PASSWORD');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.query(
    `INSERT INTO users (username, password_hash, is_admin)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = TRUE`,
    [adminUsername, passwordHash]
  );

  console.log(`Ensured admin user "${adminUsername}"`);
};

const configureApp = async () => {
  if (appConfigured) {
    return;
  }

  const sessionStore = await buildSessionStore();

  app.set('trust proxy', env.trustProxy);
  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(express.json());
  app.use(cors({
    origin: resolveCorsOrigin,
    credentials: true,
  }));
  app.use(session({
    name: 'fantaroncola.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: env.sessionCookieSameSite,
      secure: env.sessionCookieSecure,
      maxAge: 1000 * 60 * 30,
    },
  }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/singers', require('./routes/singerRoutes'));
  app.use('/api/team', require('./routes/teamRoutes'));
  app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
  app.use('/photos', express.static(path.join(__dirname, '../data/photos')));

  appConfigured = true;
};

const PORT = env.port;
const DB_INIT_MAX_ATTEMPTS = 15;
const DB_INIT_RETRY_MS = 2000;

// Database Initialization (Simple)
const initDb = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Add is_admin if not exists (migration)
  try {
      await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
  } catch (e) { console.log('Column is_admin might already exist'); }

  // Add is_team_locked if not exists (migration)
  try {
      await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_locked BOOLEAN DEFAULT FALSE');
  } catch (e) { console.log('Column is_team_locked might already exist'); }

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      allow_locked_team_edits BOOLEAN NOT NULL DEFAULT TRUE,
      allow_new_user_signups BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await db.query(
    'ALTER TABLE app_settings ALTER COLUMN allow_locked_team_edits SET DEFAULT TRUE'
  );

  await db.query(
    'ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS allow_new_user_signups BOOLEAN DEFAULT TRUE'
  );

  await db.query(
    'UPDATE app_settings SET allow_new_user_signups = TRUE WHERE allow_new_user_signups IS NULL'
  );

  await db.query(
    'ALTER TABLE app_settings ALTER COLUMN allow_new_user_signups SET DEFAULT TRUE'
  );

  await db.query(
    'ALTER TABLE app_settings ALTER COLUMN allow_new_user_signups SET NOT NULL'
  );

  await db.query(
    `INSERT INTO app_settings (id, allow_locked_team_edits, allow_new_user_signups)
     VALUES (1, TRUE, TRUE)
     ON CONFLICT (id) DO NOTHING`
  );

  await ensureAdminUser();

  await db.query(`
    CREATE TABLE IF NOT EXISTS singers (
      id SERIAL PRIMARY KEY,
      seed_key VARCHAR(255),
      name VARCHAR(255) UNIQUE NOT NULL,
      song_title VARCHAR(255),
      description TEXT,
      category VARCHAR(32) DEFAULT 'adulti',
      image VARCHAR(255),
      display_order INTEGER DEFAULT 0,
      day1_score INTEGER DEFAULT 0,
      day2_score INTEGER DEFAULT 0,
      day3_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0
    );
  `);

  // Add seed_key if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS seed_key VARCHAR(255)');
  } catch (e) { console.log('Column seed_key might already exist'); }

  // Add UNIQUE constraint on seed_key if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD CONSTRAINT singers_seed_key_key UNIQUE (seed_key)');
  } catch (e) { console.log('Constraint singers_seed_key_key might already exist'); }

  // Add song_title if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS song_title VARCHAR(255)');
  } catch (e) { console.log('Column song_title might already exist'); }

  // Add description if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS description TEXT');
  } catch (e) { console.log('Column description might already exist'); }

  // Add category if not exists (migration)
  try {
      await db.query("ALTER TABLE singers ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'adulti'");
  } catch (e) { console.log('Column category might already exist'); }

  // Add display_order if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0');
  } catch (e) { console.log('Column display_order might already exist'); }

  // Remove legacy cost column if it still exists
  try {
      await db.query('ALTER TABLE singers DROP COLUMN IF EXISTS cost');
  } catch (e) { console.log('Column cost might already be removed'); }

  // Add day1_score if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS day1_score INTEGER DEFAULT 0');
  } catch (e) { console.log('Column day1_score might already exist'); }

  // Add day2_score if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS day2_score INTEGER DEFAULT 0');
  } catch (e) { console.log('Column day2_score might already exist'); }

  // Add day3_score if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS day3_score INTEGER DEFAULT 0');
  } catch (e) { console.log('Column day3_score might already exist'); }

  // Add total_score if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0');
  } catch (e) { console.log('Column total_score might already exist'); }
  
  // Add UNIQUE constraint on name if not exists (migration)
  try {
      await db.query('ALTER TABLE singers ADD CONSTRAINT singers_name_key UNIQUE (name)');
  } catch (e) { console.log('Constraint singers_name_key might already exist'); }

  await db.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      singer_id INTEGER REFERENCES singers(id),
      UNIQUE(user_id, singer_id)
    );
  `);
  
  // Sync singers from JSON
  try {
      const singersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/singers.json'), 'utf8'));
      for (const [index, singer] of singersData.entries()) {
          const seedKey = getSeedKey(singer, index);
          const legacyPlaceholderName = getLegacyPlaceholderName(index);
          const searchNames = getSingerSearchNames(singer);
          const displayOrder = index + 1;

          let canonicalSinger = await db.query(
            'SELECT id FROM singers WHERE seed_key = $1 LIMIT 1',
            [seedKey]
          );

          if (canonicalSinger.rows.length === 0) {
            const legacySinger = await db.query(
              'SELECT id FROM singers WHERE seed_key IS NULL AND name = $1 ORDER BY id LIMIT 1',
              [legacyPlaceholderName]
            );

            if (legacySinger.rows.length > 0) {
              await db.query('UPDATE singers SET seed_key = $1 WHERE id = $2', [seedKey, legacySinger.rows[0].id]);
            } else {
              const namedSinger = await db.query(
                'SELECT id FROM singers WHERE seed_key IS NULL AND name = ANY($1::text[]) ORDER BY id LIMIT 1',
                [searchNames]
              );

              if (namedSinger.rows.length > 0) {
                await db.query('UPDATE singers SET seed_key = $1 WHERE id = $2', [seedKey, namedSinger.rows[0].id]);
              }
            }

            canonicalSinger = await db.query(
              'SELECT id FROM singers WHERE seed_key = $1 LIMIT 1',
              [seedKey]
            );
          }

          if (canonicalSinger.rows.length > 0) {
            await db.query(
              `UPDATE teams
               SET singer_id = $1
               WHERE singer_id IN (
                 SELECT id FROM singers WHERE seed_key IS NULL AND name = ANY($2::text[])
               )`,
              [canonicalSinger.rows[0].id, searchNames]
            );

            await db.query(
              'DELETE FROM singers WHERE seed_key IS NULL AND name = ANY($1::text[])',
              [searchNames]
            );
          }

          await db.query(
            `INSERT INTO singers (seed_key, name, song_title, description, category, image, display_order, day1_score, day2_score, day3_score, total_score) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0) 
             ON CONFLICT (seed_key) 
             DO UPDATE SET name = $2, song_title = $3, description = $4, category = $5, image = $6, display_order = $7`,
            [
              seedKey,
              singer.name,
              singer.song_title,
              singer.description || '',
              singer.category || 'adulti',
              singer.image,
              displayOrder,
            ]
          );
      }
      console.log('Synced singers from JSON');
  } catch (err) {
      console.error('Error syncing singers from JSON:', err.message);
  }

  try {
    await syncPointsFromCsv(db);
    console.log('Synced points from CSV');
  } catch (err) {
    console.error('Error syncing points from CSV:', err.message);
  }

  console.log('Database initialized');
};

const startServer = async () => {
  for (let attempt = 1; attempt <= DB_INIT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await configureApp();
      await initDb();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`Database init attempt ${attempt}/${DB_INIT_MAX_ATTEMPTS} failed:`, err.message);

      if (attempt === DB_INIT_MAX_ATTEMPTS) {
        process.exit(1);
      }

      await wait(DB_INIT_RETRY_MS);
    }
  }
};

startServer();
