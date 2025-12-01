const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
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
    res.status(500).send('Server Error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check user
    const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
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
    res.status(500).send('Server Error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db.query('SELECT id, username, is_admin, is_team_locked, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
