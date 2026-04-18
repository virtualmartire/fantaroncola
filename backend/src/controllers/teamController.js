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

const getAdminStats = async () => {
  const result = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE NOT is_admin) AS registered_users,
       COUNT(*) FILTER (WHERE NOT is_admin AND is_team_locked) AS confirmed_teams
     FROM users`
  );

  const row = result.rows[0] || {};

  return {
    registered_users: Number(row.registered_users || 0),
    confirmed_teams: Number(row.confirmed_teams || 0),
  };
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

exports.getAdminStats = async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
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

exports.replaceTeam = async (req, res) => {
  const { singerIds } = req.body;

  if (!Array.isArray(singerIds)) {
    return res.status(400).json({ message: 'Elenco cantanti non valido' });
  }

  const numericIds = singerIds.map((id) => Number(id));
  if (numericIds.some((id) => !Number.isInteger(id) || id < 1)) {
    return res.status(400).json({ message: 'Id cantante non valido' });
  }

  const uniqueIds = [...new Set(numericIds)];
  if (uniqueIds.length !== numericIds.length) {
    return res.status(400).json({ message: 'Non puoi selezionare lo stesso cantante piu volte' });
  }

  const expectedTotal = Object.values(TEAM_LIMITS).reduce((sum, n) => sum + n, 0);
  if (uniqueIds.length !== expectedTotal) {
    return res.status(400).json({
      message: `La squadra deve avere esattamente ${expectedTotal} cantanti`,
    });
  }

  try {
    const teamAccessState = await getTeamAccessState(req.user.id);
    if (!teamAccessState) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const currentTeam = await getTeamWithSingers(req.user.id);

    if (!canModifyLockedTeam(teamAccessState, currentTeam)) {
      return res.status(400).json({ message: 'La squadra e bloccata' });
    }

    const singersResult = await db.query('SELECT * FROM singers WHERE id = ANY($1::int[])', [uniqueIds]);
    if (singersResult.rows.length !== uniqueIds.length) {
      return res.status(400).json({ message: 'Uno o piu cantanti non sono validi' });
    }

    const counts = countTeamByCategory(singersResult.rows);
    if (!isTeamComplete(counts)) {
      return res.status(400).json({
        message: 'Per confermare la squadra devi scegliere 2 adulti e 2 bambini',
      });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM teams WHERE user_id = $1', [req.user.id]);
      for (const singerId of uniqueIds) {
        await client.query(
          'INSERT INTO teams (user_id, singer_id) VALUES ($1, $2)',
          [req.user.id, singerId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

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
