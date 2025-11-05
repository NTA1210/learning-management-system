import z from "zod";
import {listParamsSchema} from "@/validators/listParams.schema";

// Schema for listing majors with pagination and filters
export const listMajorsSchema = listParamsSchema.extend({
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
});

export type ListMajorsQuery = z.infer<typeof listMajorsSchema>;

// Schema for creating a major
export const createMajorSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    slug: z.string().min(1, "Slug is required").max(255).optional(),
    description: z.string().optional(),
});

export type CreateMajorInput = z.infer<typeof createMajorSchema>;

// Schema for updating a major
export const updateMajorSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});

export type UpdateMajorInput = z.infer<typeof updateMajorSchema>;

// Schema for major ID param
export const majorIdSchema = z.string().min(1, "Major ID is required");

export const majorSlugSchema = z.string().min(1, "Major slug is required");

