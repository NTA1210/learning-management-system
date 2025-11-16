import z from "zod";
import {listParamsSchema} from "@/validators/listParams.schema";
import {ClassStatus} from "@/types/class.type";
import mongoose from "mongoose";

// Schema for listing classes with pagination and filters
export const listClassesSchema = listParamsSchema.extend({
    courseId: z.string().optional(),
    status: z.enum(ClassStatus).optional(),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    teacherId: z.string().optional(),
});

export type ListClassesQuery = z.infer<typeof listClassesSchema>;

// Schema for creating a class
export const createClassSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    className: z.string().min(1, "Class name is required").max(100),
    teacherIds: z.array(z.string()).min(1, "At least one teacher is required"),
    capacity: z.number().min(1, "Capacity must be at least 1").max(500),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    classroom: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

// Schema for updating a class
export const updateClassSchema = z.object({
    className: z.string().min(1).max(100).optional(),
    teacherIds: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid teacherId is required"
    })).min(1).optional(),
    capacity: z.number().min(1).max(500).optional(),
    status: z.enum(ClassStatus).optional(),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    classroom: z.string().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;

// Schema for class ID param
export const classIdSchema = z.string().min(1, "Class ID is required");

// Schema for course ID param
export const courseIdSchema = z.string().min(1, "Course ID is required");

// Schema for teacher ID param
export const teacherIdSchema = z.string().min(1, "Teacher ID is required");

// Schema for student ID param
export const studentIdSchema = z.string().min(1, "Student ID is required");

