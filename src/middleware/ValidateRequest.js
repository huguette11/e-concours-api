import { validationResult } from 'express-validator';

export class ValidateRequest {
  static handle(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ erreurs: errors.array().map(e=>e.msg) });
   

    next();

  }
}