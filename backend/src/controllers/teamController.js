const db = require('../config/db');

const TEAM_LIMITS = {
  adulti: 2,
  bambini: 2,
};

const getTeamWithSingers = async (userId) => {
  const result = await db.query(
    `SELECT s.* FROM singers s
     JOIN teams t ON s.id = t.singer_id
     WHERE t.user_id = $1
     ORDER BY s.display_order ASC, s.name ASC`,
    [userId]
  );

  return result.rows;
};

const countTeamByCategory = (team) => {
  return team.reduce((counts, singer) => {
    const category = singer.category || 'adulti';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, { adulti: 0, bambini: 0 });
};

const isTeamComplete = (teamCounts) => {
  return Object.entries(TEAM_LIMITS).every(([category, limit]) => (teamCounts[category] || 0) === limit);
};

const canModifyLockedTeam = (teamAccessState, team) => {
  if (!teamAccessState.is_team_locked) {
    return true;
  }

  if (teamAccessState.allow_locked_team_edits) {
    return true;
  }

  const teamCounts = countTeamByCategory(team);
  return !isTeamComplete(teamCounts);
};

const getTeamAccessState = async (userId) => {
  const result = await db.query(
    `SELECT
       u.is_team_locked,
       COALESCE(s.allow_locked_team_edits, TRUE) AS allow_locked_team_edits
     FROM users u
     LEFT JOIN app_settings s ON s.id = 1
     WHERE u.id = $1`,
    [userId]
  );

  return result.rows[0];
};

const getCurrentTeamSettings = async () => {
  const result = await db.query(
    'SELECT COALESCE(allow_locked_team_edits, TRUE) AS allow_locked_team_edits FROM app_settings WHERE id = 1'
  );

  return result.rows[0] || { allow_locked_team_edits: true };
};

exports.getTeamSettings = async (req, res) => {
  try {
    const settings = await getCurrentTeamSettings();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.updateTeamSettings = async (req, res) => {
  const { allowLockedTeamEdits } = req.body;

  if (typeof allowLockedTeamEdits !== 'boolean') {
    return res.status(400).json({ message: 'Impostazione non valida' });
  }

  try {
    const result = await db.query(
      `INSERT INTO app_settings (id, allow_locked_team_edits)
       VALUES (1, $1)
       ON CONFLICT (id)
       DO UPDATE SET allow_locked_team_edits = EXCLUDED.allow_locked_team_edits
       RETURNING allow_locked_team_edits`,
      [allowLockedTeamEdits]
    );

    res.json({
      message: allowLockedTeamEdits
        ? 'Le squadre bloccate sono ora modificabili'
        : 'Le squadre bloccate non sono piu modificabili',
      allow_locked_team_edits: result.rows[0].allow_locked_team_edits,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await getTeamWithSingers(req.user.id);
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.addSinger = async (req, res) => {
  const { singerId } = req.body;

  try {
    const teamAccessState = await getTeamAccessState(req.user.id);
    if (!teamAccessState) {
        return res.status(404).json({ message: 'Utente non trovato' });
    }

    const currentTeam = await getTeamWithSingers(req.user.id);

    if (!canModifyLockedTeam(teamAccessState, currentTeam)) {
        return res.status(400).json({ message: 'La squadra e bloccata' });
    }

    // Check if singer exists
    const singerCheck = await db.query('SELECT * FROM singers WHERE id = $1', [singerId]);
    if (singerCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Cantante non trovato' });
    }
    const singer = singerCheck.rows[0];

    const teamCounts = countTeamByCategory(currentTeam);
    const singerCategory = singer.category || 'adulti';
    
    // Check if already in team
    const inTeam = currentTeam.some((teamSinger) => teamSinger.id === singerId);
    if (inTeam) {
        return res.status(400).json({ message: 'Questo cantante e gia nella tua squadra' });
    }

    if (!TEAM_LIMITS[singerCategory]) {
        return res.status(400).json({ message: 'Categoria cantante non valida' });
    }

    if (teamCounts[singerCategory] >= TEAM_LIMITS[singerCategory]) {
        return res.status(400).json({ message: `Hai gia selezionato ${TEAM_LIMITS[singerCategory]} ${singerCategory}` });
    }

    if (currentTeam.length >= Object.values(TEAM_LIMITS).reduce((sum, limit) => sum + limit, 0)) {
        return res.status(400).json({ message: 'La squadra e al completo' });
    }

    await db.query('INSERT INTO teams (user_id, singer_id) VALUES ($1, $2)', [req.user.id, singerId]);

    const updatedTeam = await getTeamWithSingers(req.user.id);

    res.json(updatedTeam);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.removeSinger = async (req, res) => {
  const { singerId } = req.params;

  try {
    const teamAccessState = await getTeamAccessState(req.user.id);
    if (!teamAccessState) {
        return res.status(404).json({ message: 'Utente non trovato' });
    }

    const currentTeam = await getTeamWithSingers(req.user.id);

    if (!canModifyLockedTeam(teamAccessState, currentTeam)) {
        return res.status(400).json({ message: 'La squadra e bloccata' });
    }

    await db.query('DELETE FROM teams WHERE user_id = $1 AND singer_id = $2', [req.user.id, singerId]);

    const updatedTeam = await getTeamWithSingers(req.user.id);
    res.json(updatedTeam);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.lockTeam = async (req, res) => {
  try {
    const team = await getTeamWithSingers(req.user.id);
    const teamCounts = countTeamByCategory(team);

    if (!isTeamComplete(teamCounts)) {
      return res.status(400).json({ message: 'Per confermare la squadra devi scegliere 2 adulti e 2 bambini' });
    }

    await db.query('UPDATE users SET is_team_locked = TRUE WHERE id = $1', [req.user.id]);
    res.json({ message: 'Squadra bloccata con successo', is_team_locked: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};
