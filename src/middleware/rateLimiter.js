import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,


  keyGenerator: ipKeyGenerator,

  message: {
    error: "Veuillez reessayer dans 5 minutes",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,


  keyGenerator: ipKeyGenerator,

  message: {
    error: "Trop de tentatives, reessayez dans 10 minutes",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,

  keyGenerator: (req) => {
    const id = req.body.email || req.body.telephone;

    // ✅ meilleur: identifiant + fallback IP safe
    return id ? `otp:${id}` : ipKeyGenerator(req);
  },

  message: {
    error: "Trop de tentatives OTP. Attendez 5 minutes.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});