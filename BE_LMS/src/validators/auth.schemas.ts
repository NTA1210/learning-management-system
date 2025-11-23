import { EMAIL_REGEX } from '@/constants/regex';
import z from 'zod';

export const emailSchema = z.string().min(1).max(255).regex(EMAIL_REGEX, 'Invalid email format');
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(255, 'Password must be at most 255 characters');
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .regex(
    /^[a-zA-Z0-9]+$/,
    'Username can only contain letters and numbers, no spaces or special characters'
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    username: usernameSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verificationCodeSchema = z.string().length(24);
export const resetPasswordSchema = z.object({
  verificationCode: verificationCodeSchema,
  password: passwordSchema,
});
