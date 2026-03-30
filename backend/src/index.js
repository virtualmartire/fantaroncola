const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const db = require('./config/db');
const { syncPointsFromCsv } = require('./utils/syncPoints');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getSeedKey = (singer, index) => singer.seed_key || `slot-${index + 1}`;
const getLegacyPlaceholderName = (index) => `Singer ${String.fromCharCode(65 + index)}`;

// Middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(session({
  name: 'fantaroncola.sid',
  secret: process.env.SESSION_SECRET || 'fantaroncola-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30,
  },
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/singers', require('./routes/singerRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/photos', express.static(path.join(__dirname, '../data/photos')));

const PORT = process.env.PORT || 3000;
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
    CREATE TABLE IF NOT EXISTS singers (
      id SERIAL PRIMARY KEY,
      seed_key VARCHAR(255),
      name VARCHAR(255) UNIQUE NOT NULL,
      song_title VARCHAR(255),
      description TEXT,
      cost INTEGER NOT NULL,
      image VARCHAR(255),
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
                'SELECT id FROM singers WHERE seed_key IS NULL AND name = $1 ORDER BY id LIMIT 1',
                [singer.name]
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
                 SELECT id FROM singers WHERE seed_key IS NULL AND name = $2
               )`,
              [canonicalSinger.rows[0].id, singer.name]
            );

            await db.query(
              'DELETE FROM singers WHERE seed_key IS NULL AND name = $1',
              [singer.name]
            );
          }

          await db.query(
            `INSERT INTO singers (seed_key, name, song_title, description, cost, image, total_score) 
             VALUES ($1, $2, $3, $4, $5, $6, 0) 
             ON CONFLICT (seed_key) 
             DO UPDATE SET name = $2, song_title = $3, description = $4, cost = $5, image = $6`,
            [seedKey, singer.name, singer.song_title, singer.description, singer.cost, singer.image]
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
