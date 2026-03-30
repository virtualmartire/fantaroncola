const fs = require('fs');
const path = require('path');

const POINTS_SYNC_TTL_MS = 3000;
let lastPointsSyncAt = 0;
let lastPointsMtimeMs = null;

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const syncPointsFromCsv = async (db) => {
  const pointsPath = path.join(__dirname, '../../data/points.csv');
  const now = Date.now();

  if (!fs.existsSync(pointsPath)) {
    return;
  }

  const { mtimeMs } = fs.statSync(pointsPath);
  if (mtimeMs === lastPointsMtimeMs && now - lastPointsSyncAt < POINTS_SYNC_TTL_MS) {
    return;
  }

  const csvData = fs.readFileSync(pointsPath, 'utf8');
  const lines = csvData.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCsvLine(line);
    if (i === 0 && parts[0].toLowerCase() === 'name') {
      continue;
    }

    const name = parts[0];
    if (!name) continue;

    const totalPoints = parts.slice(1).reduce((sum, value) => {
      return sum + (parseInt(value, 10) || 0);
    }, 0);

    await db.query('UPDATE singers SET total_score = $1 WHERE name = $2', [totalPoints, name]);
  }

  lastPointsSyncAt = now;
  lastPointsMtimeMs = mtimeMs;
};

module.exports = { syncPointsFromCsv };
