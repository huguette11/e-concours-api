import rateLimit from "express-rate-limit";

// je vais limiter le noombre de requetes pour eviter que le backend crash et ou pour limiter les attauqtes
export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: {
    error: "Veuillez réessayer dans 5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    error: "Trop de tentatives, réessayez dans 10 minutes",
  },
});


export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    return req.body.email || req.body.telephone || req.ip;
  },
  message: {
    error: "Trop de tentatives OTP. Attendez 5 minutes.",
  },
});