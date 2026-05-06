const jwt = require('jsonwebtoken');
const env = require('../config/env');

const saveSession = (req) => new Promise((resolve, reject) => {
  req.session.save((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

module.exports = async function(req, res, next) {
  if (req.session?.userId) {
    req.user = { id: req.session.userId };
    next();
    return;
  }

  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Autorizzazione negata' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;

    if (req.session && !req.session.userId) {
      req.session.userId = decoded.id;
      req.session.cookie.maxAge = env.authSessionMaxAgeMs;
      await saveSession(req);
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Sessione non valida' });
  }
};
