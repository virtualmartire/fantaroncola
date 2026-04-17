const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'Token mancante, autorizzazione negata' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token non valido' });
  }
};
