import z from "zod";
import {EMAIL_REGEX} from "@/constants/regex";
import { datePreprocess } from "./helpers/date.schema";
// Schema để tạo invite link
export const createCourseInviteSchema = z.object({
  courseId: z.string().length(24, "Invalid courseId format"),
  invitedEmails: z
  .array(z.string().regex(EMAIL_REGEX, "Invalid email format"))
  .min(1, "At least one email is required")
  .max(100, "Cannot invite more than 100 emails at once"),
  expiresInDays: z
    .number()
    .int()
    .min(1, "Expires must be at least 1 day")
    .max(365, "Expires cannot exceed 365 days")
    .default(7),
  maxUses: z
    .number()
    .int()
    .min(1, "Max uses must be at least 1")
    .nullable()
    .optional()
    .default(null),
});

export type TCreateCourseInvite = z.infer<typeof createCourseInviteSchema>;

export const joinCourseInviteSchema = z.object({
  token: z
    .string()
    .length(64, "Invalid invite token format")
    .regex(/^[a-f0-9]{64}$/, "Invalid invite token format"),
})

export type TJoinCourseInvite = z.infer<typeof joinCourseInviteSchema>;

export const listCourseInvitesSchema = z.object({
  courseId: z
  .string()
  .length(24, "Invalid Course Format")
  .optional(),
  invitedEmail: z
  .string()
  .optional(),
  isActive: z
  .enum(["true", "false"])
  .transform((val) => val === "true")
  .optional(),
  page: z 
  .coerce.number()
  .int().min(1)
  .default(1),
  limit: z
  .coerce.number()
  .int()
  .min(1)
  .max(100)
  .default(10),
  from: datePreprocess,
  to: datePreprocess,
})
.refine(
  (val) => {
    if (val.from && val.to) {
      return val.from.getTime() <= val.to.getTime();
    }
    return true;
  },
  {
    message: "From date must be less than or equal to To date",
    path: ["to"],
  }
)
export type TListCourseInvite = z.infer<typeof listCourseInvitesSchema>;

// Schema để cập nhật invite link
export const updateCourseInviteSchema = z.object({
  isActive: z
    .union([
      z.boolean(),
      z.string().transform((val) => val === "true" || val === "1"),
    ])
    .optional(),
  expiresInDays: z
    .number()
    .int()
    .min(1, "Expires must be at least 1 day")
    .max(365, "Expires cannot exceed 365 days")
    .optional(),
  maxUses: z
    .number()
    .int()
    .min(1, "Max uses must be at least 1")
    .nullable()
    .optional(),
});

export type TUpdateCourseInvite = z.infer<typeof updateCourseInviteSchema>;

// Schema để validate inviteId trong params
export const courseInviteIdSchema = z.object({
  id: z.string().length(24, "Invalid invite ID format"),
});

export type TCourseInviteId = z.infer<typeof courseInviteIdSchema>;