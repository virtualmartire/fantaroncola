const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const env = require('../config/env');

const areNewUserSignupsAllowed = async () => {
  const result = await db.query(
    `SELECT COALESCE(allow_new_user_signups, TRUE) AS allow_new_user_signups
     FROM app_settings
     WHERE id = 1`
  );

  return result.rows[0]?.allow_new_user_signups ?? true;
};

const buildUserPayload = (userRow) => ({
  id: userRow.id,
  username: userRow.username,
  is_admin: userRow.is_admin,
  is_team_locked: userRow.is_team_locked,
});

const regenerateSession = (req) => new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

const saveSession = (req) => new Promise((resolve, reject) => {
  req.session.save((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

const destroySession = (req) => new Promise((resolve, reject) => {
  if (!req.session) {
    resolve();
    return;
  }

  req.session.destroy((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

const establishAuthenticatedSession = async (req, userId) => {
  await regenerateSession(req);
  req.session.userId = userId;
  req.session.cookie.maxAge = env.authSessionMaxAgeMs;
  await saveSession(req);
};

const createLegacyToken = (userId) => jwt.sign({ id: userId }, env.jwtSecret, {
  expiresIn: '1d',
});

exports.getCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 1,
    color: false,
    background: '#120d09',
    ignoreChars: '0oO1ilI',
  });

  req.session.captcha = captcha.text.toLowerCase();
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.type('svg').send(captcha.data);
};

exports.register = async (req, res) => {
  const { username, password, captcha } = req.body;

  if (!username || !password || !captcha) {
    return res.status(400).json({ message: 'Username, password e captcha sono obbligatori' });
  }

  try {
    const allowNewUserSignups = await areNewUserSignupsAllowed();
    if (!allowNewUserSignups) {
      return res.status(403).json({ message: 'Le nuove registrazioni sono disabilitate.' });
    }

    const expectedCaptcha = req.session?.captcha;
    if (!expectedCaptcha || captcha.trim().toLowerCase() !== expectedCaptcha) {
      req.session.captcha = null;
      return res.status(400).json({ message: 'Captcha non valido. Riprova' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Questo username e gia in uso' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, is_admin, is_team_locked, created_at',
      [username, hashedPassword]
    );

    await establishAuthenticatedSession(req, newUser.rows[0].id);

    res.status(201).json({
      token: createLegacyToken(newUser.rows[0].id),
      user: buildUserPayload(newUser.rows[0]),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check user
    const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password non corretta' });
    }

    await establishAuthenticatedSession(req, user.rows[0].id);

    res.json({
      token: createLegacyToken(user.rows[0].id),
      user: buildUserPayload(user.rows[0]),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db.query('SELECT id, username, is_admin, is_team_locked, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.logout = async (req, res) => {
  try {
    await destroySession(req);
    res.clearCookie('fantaroncola.sid');
    res.status(204).end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};
