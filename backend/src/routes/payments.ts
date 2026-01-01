import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { createPaymentIntentEndpoint, verifyPayment } from '../controllers/payments';
import { authenticateFromCookie } from '../utils/jwt';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array().map((err) => ({
          field: err.param as string,
          message: err.msg,
          value: err.value,
        })),
      },
    });
  }
  next();
};

router.post(
  '/create-payment-intent',
  csrfProtection,
  authenticateFromCookie,
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be greater than 0')
      .bail()
      .toFloat()
      .custom((value: number) => {
        if (value < 0.01) throw new Error('Amount must be at least 0.01');
        if (value > 1_000_000) throw new Error('Amount exceeds maximum allowed limit');
        return true;
      }),

    body('currency')
      .trim()
      .toUpperCase()
      .notEmpty()
      .withMessage('Currency is required')
      .bail()
      .isIn(['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'XAF', 'EGP'])
      .withMessage('Unsupported currency'),

    body('email')
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email address')
      .bail()
      .normalizeEmail(),

    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  handleValidationErrors,
  createPaymentIntentEndpoint
);

router.post(
  '/verify',
  csrfProtection,
  authenticateFromCookie,
  [
    body('reference')
      .trim()
      .notEmpty()
      .withMessage('Payment reference is required')
      .bail()
      .isLength({ min: 5, max: 100 })
      .withMessage('Payment reference must be between 5 and 100 characters')
      .bail()
      .isAlphanumeric()
      .withMessage('Payment reference contains invalid characters'),
  ],
  handleValidationErrors,
  verifyPayment
);

export default router;