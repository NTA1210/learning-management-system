import { ListParams } from "@/types/dto";
import z from "zod";

export const listParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  // .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  // .refine((val) => val > 0 && val <= 100, {
  //   message: "Limit must be between 1 and 100",
  // }),
  search: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  sortBy: z.enum(["createdAt", "title", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
}) satisfies z.ZodType<ListParams>;
