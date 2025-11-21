import z, { email } from "zod";

export const listAllUsersSchema = z.object({
  role: z.string().optional(),
  email: email().optional(),
  username: z.string().optional(),
  status: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
});

export const courseIdSchema = z.string().length(24, "Invalid course ID");

export type TGetAllUsersFilter = z.infer<typeof listAllUsersSchema>;
