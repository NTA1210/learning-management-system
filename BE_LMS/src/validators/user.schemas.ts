import { EMAIL_REGEX, INTERNATIONAL_PHONE_REGEX, VIETNAM_PHONE_REGEX } from '@/constants/regex';
import { UserStatus } from '@/types';
import z, { email } from 'zod';

const specialistIdsSchema = z.string().length(24, 'Invalid specialist ID');
export const listAllUsersSchema = z.object({
  role: z.string().optional(),
  email: email().optional(),
  username: z.string().optional(),
  status: z.string().optional(),
  specialistIds: z.array(specialistIdsSchema).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
});

export const courseIdSchema = z.string().length(24, 'Invalid course ID');

export type TGetAllUsersFilter = z.infer<typeof listAllUsersSchema>;

export const userIdSchema = z.string().length(24, 'Invalid user ID');

export const updateUserProfileSchema = z.object({
  userId: userIdSchema,
  username: z.string().optional(),
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format').optional(),
  fullname: z.string().optional(),
  phone_number: z
    .string()
    .regex(VIETNAM_PHONE_REGEX || INTERNATIONAL_PHONE_REGEX, {
      message: 'Invalid phone number format',
    })
    .optional(),
  avatar: z.any().optional(),
  bio: z.string().optional(),
  status: z.enum(UserStatus).optional(),
  specialistIds: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
});

export type TUpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
