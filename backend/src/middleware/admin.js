const db = require('../config/db');

module.exports = async function(req, res, next) {
  try {
    // req.user is set by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Token mancante, autorizzazione negata' });
    }

    const user = await db.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    if (!user.rows[0].is_admin) {
      return res.status(403).json({ message: 'Accesso negato. Solo admin.' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};
