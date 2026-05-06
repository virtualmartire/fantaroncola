const db = require('../config/db');
const { syncPointsFromCsv } = require('../utils/syncPoints');

exports.getAllSingers = async (req, res) => {
  try {
    await syncPointsFromCsv(db);
    const result = await db.query('SELECT * FROM singers ORDER BY display_order ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.createSinger = async (req, res) => {
  const { name, song_title, description, category, image, is_available } = req.body;
  try {
    const newSinger = await db.query(
      `INSERT INTO singers (name, song_title, description, category, image, is_available, total_score)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [name, song_title, description, category || 'adulti', image, is_available !== false]
    );
    res.json(newSinger.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.updateSinger = async (req, res) => {
  const { id } = req.params;
  const { name, song_title, description, category, image, total_score, is_available } = req.body;
  try {
    const updatedSinger = await db.query(
      `UPDATE singers
       SET name = $1, song_title = $2, description = $3, category = $4, image = $5, total_score = $6, is_available = COALESCE($7, is_available)
       WHERE id = $8
       RETURNING *`,
      [
        name,
        song_title,
        description,
        category || 'adulti',
        image,
        total_score,
        typeof is_available === 'boolean' ? is_available : null,
        id,
      ]
    );
    if (updatedSinger.rows.length === 0) {
      return res.status(404).json({ message: 'Cantante non trovato' });
    }
    res.json(updatedSinger.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.deleteSinger = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM singers WHERE id = $1', [id]);
    res.json({ message: 'Cantante eliminato' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Errore del server' });
  }
};
