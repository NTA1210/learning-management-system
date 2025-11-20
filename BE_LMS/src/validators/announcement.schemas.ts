import z from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(255),
    content: z.string().min(10, "Content must be at least 10 characters"),
    courseId: z.string().min(1, "Course ID is required"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
