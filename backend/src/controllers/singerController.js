const db = require('../config/db');

exports.getAllSingers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM singers ORDER BY cost DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createSinger = async (req, res) => {
  const { name, description, cost, image } = req.body;
  try {
    const newSinger = await db.query(
      'INSERT INTO singers (name, description, cost, image, total_score) VALUES ($1, $2, $3, $4, 0) RETURNING *',
      [name, description, cost, image]
    );
    res.json(newSinger.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateSinger = async (req, res) => {
  const { id } = req.params;
  const { name, description, cost, image, total_score } = req.body;
  try {
    const updatedSinger = await db.query(
      'UPDATE singers SET name = $1, description = $2, cost = $3, image = $4, total_score = $5 WHERE id = $6 RETURNING *',
      [name, description, cost, image, total_score, id]
    );
    if (updatedSinger.rows.length === 0) {
      return res.status(404).json({ message: 'Singer not found' });
    }
    res.json(updatedSinger.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteSinger = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM singers WHERE id = $1', [id]);
    res.json({ message: 'Singer deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
