require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const getRawEnv = (name) => {
  const value = process.env[name];

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

const requireEnv = (name, fallback) => {
  const value = getRawEnv(name);

  if (value !== undefined) {
    return value;
  }

  if (!isProduction && fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable ${name}`);
};

const getIntEnv = (name, fallback) => {
  const value = getRawEnv(name);

  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  return parsedValue;
};

const getListEnv = (name) => {
  const value = getRawEnv(name);

  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const parseTrustProxy = (value) => {
  if (value === undefined) {
    return 1;
  }

  const normalizedValue = value.toLowerCase();

  if (['true', 'yes', '1'].includes(normalizedValue)) {
    return true;
  }

  if (['false', 'no', '0'].includes(normalizedValue)) {
    return false;
  }

  const numericValue = Number.parseInt(value, 10);
  if (!Number.isNaN(numericValue) && String(numericValue) === value) {
    return numericValue;
  }

  return value;
};

const parseSameSite = (value) => {
  const normalizedValue = (value || 'lax').toLowerCase();

  if (!['lax', 'strict', 'none'].includes(normalizedValue)) {
    throw new Error('SESSION_COOKIE_SAME_SITE must be one of lax, strict, or none');
  }

  return normalizedValue;
};

const parseCookieSecure = (value) => {
  if (value === undefined) {
    return isProduction ? 'auto' : false;
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === 'auto') {
    return 'auto';
  }

  if (['true', 'yes', '1'].includes(normalizedValue)) {
    return true;
  }

  if (['false', 'no', '0'].includes(normalizedValue)) {
    return false;
  }

  throw new Error('SESSION_COOKIE_SECURE must be true, false, or auto');
};

module.exports = {
  isProduction,
  port: getIntEnv('PORT', 3000),
  trustProxy: parseTrustProxy(getRawEnv('TRUST_PROXY')),
  jwtSecret: requireEnv('JWT_SECRET', 'secret'),
  sessionSecret: requireEnv('SESSION_SECRET', 'fantaroncola-session-secret'),
  authSessionMaxAgeMs: getIntEnv('AUTH_SESSION_MAX_AGE_MS', 30 * 24 * 60 * 60 * 1000),
  sessionCookieSameSite: parseSameSite(getRawEnv('SESSION_COOKIE_SAME_SITE')),
  sessionCookieSecure: parseCookieSecure(getRawEnv('SESSION_COOKIE_SECURE')),
  allowedOrigins: getListEnv('CORS_ORIGIN'),
  redisUrl: isProduction ? requireEnv('REDIS_URL') : getRawEnv('REDIS_URL'),
  authRateLimitWindowMs: getIntEnv('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  authRateLimitMax: getIntEnv('AUTH_RATE_LIMIT_MAX', 20),
  adminUsername: getRawEnv('ADMIN_USERNAME'),
  adminPassword: getRawEnv('ADMIN_PASSWORD'),
  db: {
    user: requireEnv('DB_USER', 'postgres'),
    host: requireEnv('DB_HOST', 'db'),
    name: requireEnv('DB_NAME', 'fantaroncola'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
    port: getIntEnv('DB_PORT', 5432),
  },
};
