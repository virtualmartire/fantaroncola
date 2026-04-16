const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');

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

  const expectedCaptcha = req.session?.captcha;
  if (!expectedCaptcha || captcha.trim().toLowerCase() !== expectedCaptcha) {
    req.session.captcha = null;
    return res.status(400).json({ message: 'Captcha non valido. Riprova' });
  }

  try {
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

    // Create token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d',
    });

    req.session.captcha = null;

    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        is_admin: newUser.rows[0].is_admin,
        is_team_locked: newUser.rows[0].is_team_locked,
      },
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

    // Return token
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        is_admin: user.rows[0].is_admin,
        is_team_locked: user.rows[0].is_team_locked,
      },
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
