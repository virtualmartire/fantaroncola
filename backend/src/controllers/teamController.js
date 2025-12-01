const db = require('../config/db');

exports.getTeam = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.* FROM singers s
       JOIN teams t ON s.id = t.singer_id
       WHERE t.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addSinger = async (req, res) => {
  const { singerId } = req.body;

  try {
    // Check if locked
    const userCheck = await db.query('SELECT is_team_locked FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0].is_team_locked) {
        return res.status(400).json({ message: 'Team is locked' });
    }

    // Check if singer exists
    const singerCheck = await db.query('SELECT * FROM singers WHERE id = $1', [singerId]);
    if (singerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Singer not found' });
    }
    const singer = singerCheck.rows[0];

    // Check current team size
    const teamCheck = await db.query('SELECT * FROM teams WHERE user_id = $1', [req.user.id]);
    if (teamCheck.rows.length >= 5) {
        return res.status(400).json({ message: 'Team is full' });
    }
    
    // Check if already in team
    const inTeam = teamCheck.rows.some(row => row.singer_id === singerId);
    if (inTeam) {
        return res.status(400).json({ message: 'Singer already in team' });
    }

    // Check budget (optional, but good)
    // Get current team cost
    const teamCostResult = await db.query(
        `SELECT SUM(s.cost) as total_cost 
         FROM singers s 
         JOIN teams t ON s.id = t.singer_id 
         WHERE t.user_id = $1`, 
         [req.user.id]
    );
    const currentCost = parseInt(teamCostResult.rows[0].total_cost || 0);
    
    if (currentCost + singer.cost > 100) { // Hardcoded 100 budget
        return res.status(400).json({ message: 'Budget exceeded' });
    }

    await db.query('INSERT INTO teams (user_id, singer_id) VALUES ($1, $2)', [req.user.id, singerId]);
    
    // Return updated team or just success
    const updatedTeam = await db.query(
        `SELECT s.* FROM singers s
         JOIN teams t ON s.id = t.singer_id
         WHERE t.user_id = $1`,
        [req.user.id]
    );
    
    res.json(updatedTeam.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.removeSinger = async (req, res) => {
  const { singerId } = req.params;

  try {
    // Check if locked
    const userCheck = await db.query('SELECT is_team_locked FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0].is_team_locked) {
        return res.status(400).json({ message: 'Team is locked' });
    }

    await db.query('DELETE FROM teams WHERE user_id = $1 AND singer_id = $2', [req.user.id, singerId]);
    
    const updatedTeam = await db.query(
        `SELECT s.* FROM singers s
         JOIN teams t ON s.id = t.singer_id
         WHERE t.user_id = $1`,
        [req.user.id]
    );
    res.json(updatedTeam.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.lockTeam = async (req, res) => {
  try {
    await db.query('UPDATE users SET is_team_locked = TRUE WHERE id = $1', [req.user.id]);
    res.json({ message: 'Team locked successfully', is_team_locked: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
