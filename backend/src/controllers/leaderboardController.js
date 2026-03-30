const db = require('../config/db');
const { syncPointsFromCsv } = require('../utils/syncPoints');

exports.getLeaderboard = async (req, res) => {
  try {
    await syncPointsFromCsv(db);

    const leaderboard = await db.query(`
      SELECT
        u.username,
        COALESCE(SUM(s.day1_score), 0) as day1_score,
        COALESCE(SUM(s.day2_score), 0) as day2_score,
        COALESCE(SUM(s.day3_score), 0) as day3_score,
        COALESCE(SUM(s.total_score), 0) as total_score
      FROM users u
      JOIN teams t ON u.id = t.user_id
      JOIN singers s ON t.singer_id = s.id
      GROUP BY u.id, u.username
      ORDER BY total_score DESC, day3_score DESC, day2_score DESC, day1_score DESC, u.username ASC
    `);
    
    res.json(leaderboard.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};
