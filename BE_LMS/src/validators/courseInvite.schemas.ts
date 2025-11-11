import z from "zod";

// Schema để tạo invite link
export const createCourseInviteSchema = z.object({
  courseId: z.string().length(24, "Invalid courseId format"),
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

