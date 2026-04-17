const rateLimit = require('express-rate-limit');
const env = require('../config/env');

module.exports = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Troppi tentativi di accesso. Riprova tra qualche minuto.',
  },
});
