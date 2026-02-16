import rateLimit from "express-rate-limit";

const jsonHandler = (req, res) => {
  res.status(429).json({
    error: "RATE_LIMITED",
    message: "Too many requests. Please try again later."
  });
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

