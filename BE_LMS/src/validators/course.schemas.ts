import z from "zod";
import { CourseStatus } from "../types/course.type";
import { datePreprocess } from "./helpers/date.schema";

// ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Schema for listing courses with pagination and filters
export const listCoursesSchema = z
    .object({
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
        search: z.string().optional(),
        from: datePreprocess.optional(), // Date range start with validation
        to: datePreprocess.optional(), // Date range end with validation
        subjectId: z.string().regex(objectIdRegex, "Invalid subject ID format").optional(), // Filter by subject ID
        semesterId: z.string().regex(objectIdRegex, "Invalid semester ID format").optional(), // Filter by semester ID
        teacherId: z.string().regex(objectIdRegex, "Invalid teacher ID format").optional(), // Filter by teacher ID
        isPublished: z
            .string()
            .optional()
            .transform((val) => {
                if (val === "true") return true;
                if (val === "false") return false;
                return undefined;
            }),
        status: z
            .enum([CourseStatus.DRAFT, CourseStatus.ONGOING, CourseStatus.COMPLETED])
            .optional(), // Filter by status
        // ✅ SOFT DELETE: Admin can view deleted courses
        includeDeleted: z
            .string()
            .optional()
            .transform((val) => {
                if (val === "true") return true;
                if (val === "false") return false;
                return undefined;
            }), // Admin only - show deleted courses
        onlyDeleted: z
            .string()
            .optional()
            .transform((val) => {
                if (val === "true") return true;
                return false;
            }), // Admin only - show only deleted courses
        sortBy: z
            .enum([
                "createdAt",
                "title",
                "updatedAt",
                "startDate",
                "endDate",
                "deletedAt",
            ])
            .optional(),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    })
    .refine(
        (val) => {
            if (val.from && val.to) {
                return val.from.getTime() <= val.to.getTime();
            }
            return true;
        },
        {
            message: "Start date must be before or equal to end date",
            path: ["to"],
        }
    );

export type ListCoursesQuery = z.infer<typeof listCoursesSchema>;

// Schema for creating a course
export const createCourseSchema = z
    .object({
        title: z.string().min(1, "Title is required").max(255),
        // ✅ UNIVERSITY RULE: Subject is required (every course must belong to a subject)
        subjectId: z.string().regex(objectIdRegex, "Invalid subject ID format"),
        logo: z.string().optional(), // URL to logo image
        description: z.string().optional(),
        startDate: z
            .string()
            .min(1, "Start date is required")
            .transform((val) => new Date(val)), // Required
        endDate: z
            .string()
            .min(1, "End date is required")
            .transform((val) => new Date(val)), // Required
        status: z
            .string()
            .optional()
            .transform((val) => {
                if (!val) return CourseStatus.DRAFT;
                // Transform to lowercase to match enum values
                const normalized = val.toLowerCase();
                if (
                    normalized === "draft" ||
                    normalized === "ongoing" ||
                    normalized === "completed"
                ) {
                    return normalized as CourseStatus;
                }
                return val;
            })
            .pipe(
                z.enum([
                    CourseStatus.DRAFT,
                    CourseStatus.ONGOING,
                    CourseStatus.COMPLETED,
                ])
            )
            .default(CourseStatus.DRAFT),
        teacherIds: z
            .union([
                z.string().transform((val) => JSON.parse(val)), // Parse JSON string from multipart
                z.array(z.string()), // Already array
            ])
            .pipe(z.array(z.string()).min(1, "At least one teacher is required")), // Required
        semesterId: z.string().regex(objectIdRegex, "Invalid semester ID format"), // Required
        isPublished: z
            .union([
                z.boolean(),
                z.string().transform((val) => val === "true" || val === "1"),
            ])
            .optional()
            .default(false),
        // ✅ UNIVERSITY RULE: Capacity must be reasonable (10-500 students per class)
        capacity: z
            .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
            .pipe(z.number().int().min(1).max(500))
            .optional(),
        enrollRequiresApproval: z
            .union([
                z.boolean(),
                z.string().transform((val) => val === "true" || val === "1"),
            ])
            .optional()
            .default(false),
        enrollPasswordHash: z.string().nullish(), // Pre-hashed password (can be null or undefined)
        meta: z
            .union([
                z.record(z.string(), z.any()), // Already object
                z.string().transform((val) => JSON.parse(val)), // Parse JSON string from multipart
            ])
            .optional(),
    })
    .refine((data) => data.endDate > data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
    });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

// Schema for updating a course
export const updateCourseSchema = z
    .object({
        title: z.string().min(1).max(255).optional(),
        subjectId: z.string().regex(objectIdRegex, "Invalid subject ID format").optional(), // ✅ NEW: Subject reference
        logo: z.string().nullish(), // ✅ Allow null or empty string to remove logo
        description: z.string().optional(),
        startDate: z
            .string()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        endDate: z
            .string()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        status: z
            .string()
            .optional()
            .transform((val) => {
                if (!val) return undefined;
                // Transform to lowercase to match enum values
                const normalized = val.toLowerCase();
                if (
                    normalized === "draft" ||
                    normalized === "ongoing" ||
                    normalized === "completed"
                ) {
                    return normalized as CourseStatus;
                }
                return val;
            })
            .pipe(
                z
                    .enum([
                        CourseStatus.DRAFT,
                        CourseStatus.ONGOING,
                        CourseStatus.COMPLETED,
                    ])
                    .optional()
            ),
        teacherIds: z
            .union([
                z.array(z.string()),
                z.string().transform((val) => JSON.parse(val)),
            ])
            .pipe(z.array(z.string()).min(1))
            .optional(),
        isPublished: z
            .union([
                z.boolean(),
                z.string().transform((val) => val === "true" || val === "1"),
            ])
            .optional(),
        // ✅ UNIVERSITY RULE: Capacity must be reasonable (10-500 students per class)
        capacity: z
            .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
            .pipe(z.number().int().min(1).max(500))
            .optional(),
        enrollRequiresApproval: z
            .union([
                z.boolean(),
                z.string().transform((val) => val === "true" || val === "1"),
            ])
            .optional(),
        enrollPasswordHash: z.string().nullish(),
        meta: z
            .union([
                z.record(z.string(), z.any()),
                z.string().transform((val) => JSON.parse(val)),
            ])
            .optional(),
    })
    .refine(
        (data) => {
            // If both dates are provided, endDate must be after startDate
            if (data.startDate && data.endDate) {
                return data.endDate > data.startDate;
            }
            return true;
        },
        {
            message: "End date must be after start date",
            path: ["endDate"],
        }
    );

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// Schema for course ID param
export const courseIdSchema = z.string().regex(objectIdRegex, "Invalid course ID format");
