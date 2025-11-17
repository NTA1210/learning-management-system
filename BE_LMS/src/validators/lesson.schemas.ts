import z from "zod";
import ListParams from "@/types/dto/listParams.dto";
import { listParamsSchema } from "./listParams.schema";
import { datePreprocess } from "./helpers/date.schema";

export const CreateLessonSchema = z.object({
    title: z.string().min(1).max(255),
    courseId: z.string().min(1),
    content: z.string().optional(),
    order: z.number().optional(),
    durationMinutes: z.number().optional(),
    publishedAt: z.coerce.date().optional(),
});

type LessonQueryFilters = ListParams & {
    title?: string;
    content?: string;
    order?: number;
    durationMinutes?: number;
    publishedAt?: Date;
    courseId?: string;
    from?: Date;
    to?: Date;
};

export const LessonQuerySchema = (listParamsSchema.extend({
    title: z.string().optional(),
    content: z.string().optional(),
    order: z.coerce.number().optional(),
    durationMinutes: z.coerce.number().optional(),
    publishedAt: z.coerce.date().optional(),
    courseId: z.string().optional(),
    createdAt: datePreprocess,
    updatedAt: datePreprocess,
    from: datePreprocess.optional(),
    to: datePreprocess.optional(),
}).refine(
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
)) satisfies z.ZodType<LessonQueryFilters>;

export const LessonByIdSchema = z.object({
    id: z.string().min(1, "ID is required"),
});
export type CreateLessonParams = z.infer<typeof CreateLessonSchema>;
export type LessonQueryParams = z.infer<typeof LessonQuerySchema>;
export type LessonByIdParams = z.infer<typeof LessonByIdSchema>;