import z from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(255),
    content: z.string().min(10, "Content must be at least 10 characters"),
    courseId: z.string().min(1, "Course ID is required"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const announcementIdSchema = z.string().min(1, "Announcement ID is required");
export const courseIdParamSchema = z.string().length(24, "Invalid course ID");

export const getAnnouncementsQuerySchema = z.object({
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
