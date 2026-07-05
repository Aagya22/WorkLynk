import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    message: 'Too many login attempts from this IP, please try again after a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
