const db = require('../config/db');

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await db.query(`
      SELECT u.username, SUM(s.total_score) as total_score
      FROM users u
      JOIN teams t ON u.id = t.user_id
      JOIN singers s ON t.singer_id = s.id
      GROUP BY u.id, u.username
      ORDER BY total_score DESC
    `);
    
    res.json(leaderboard.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
