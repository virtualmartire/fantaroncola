const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const db = require('./config/db');

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/singers', require('./routes/singerRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/photos', express.static(path.join(__dirname, '../data/photos')));

const PORT = process.env.PORT || 3000;

// Database Initialization (Simple)
const initDb = async () => {
  try {
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
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        cost INTEGER NOT NULL,
        image VARCHAR(255),
        total_score INTEGER DEFAULT 0
      );
    `);

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
        for (const singer of singersData) {
            await db.query(
                `INSERT INTO singers (name, description, cost, image, total_score) 
                 VALUES ($1, $2, $3, $4, 0) 
                 ON CONFLICT (name) 
                 DO UPDATE SET description = $2, cost = $3, image = $4`,
                [singer.name, singer.description, singer.cost, singer.image]
            );
        }
        console.log('Synced singers from JSON');
    } catch (err) {
        console.error('Error syncing singers from JSON:', err.message);
    }

    // Sync points from CSV
    try {
        const pointsPath = path.join(__dirname, '../data/points.csv');
        if (fs.existsSync(pointsPath)) {
            const csvData = fs.readFileSync(pointsPath, 'utf8');
            const lines = csvData.trim().split('\n');
            // Skip header
            const header = lines[0].split(',');
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                const name = parts[0];
                let totalPoints = 0;
                
                // Sum points from all day columns (assuming format: name,day1,day2,...)
                for (let j = 1; j < parts.length; j++) {
                    totalPoints += parseInt(parts[j]) || 0;
                }

                await db.query(
                    'UPDATE singers SET total_score = $1 WHERE name = $2',
                    [totalPoints, name]
                );
            }
            console.log('Synced points from CSV');
        }
    } catch (err) {
        console.error('Error syncing points from CSV:', err.message);
    }

    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

app.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on port ${PORT}`);
});
