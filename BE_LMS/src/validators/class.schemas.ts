import z from "zod";
import {listParamsSchema} from "@/validators/listParams.schema";
import {ClassStatus} from "@/types/class.type";
import mongoose from "mongoose";
import {ACTUAL_MAX_CLASS_LIMIT} from "@/constants/fieldLimits";

// Schema for listing classes with pagination and filters
export const listClassesSchema = listParamsSchema.extend({
    courseId: z.string().optional(),
    status: z.enum(ClassStatus).optional(),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    teacherId: z.string().optional(),
});

export type ListClassesQuery = z.infer<typeof listClassesSchema>;

export const createEmptyClassesSchema = z.object({
    courseId: z.string().min(1, "At least one course is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid courseId is required"
    }),
    totalStudents: z.number().min(0).max(ACTUAL_MAX_CLASS_LIMIT).optional(),
});

export type CreateEmptyClassesInput = z.infer<typeof createEmptyClassesSchema> & { createdBy: mongoose.Types.ObjectId };

export const assignStudentsToClassesSchema = z.object({
    classIds: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid classId is required"
    })).min(1, "At least one classId is required"),
    courseId: z.string().min(1, "At least one course is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid courseId is required"
    }),
});

// Schema for creating a class
export const createClassSchema = z.object({
    courseId: z.string().min(1, "At least one course is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid courseId is required"
    }),
    className: z.string().min(1, "Class name is required").max(100),
    teacherId: z.string().min(1, "At least one teacher is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid teacherId (userId) is required"
    }),
    capacity: z.number().min(1, "Capacity must be at least 1").max(ACTUAL_MAX_CLASS_LIMIT),
    currentEnrollment: z.number().min(0),
    status: z.enum(ClassStatus),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    classroom: z.string().optional(),
    meta: z.any().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema> & { createdBy: mongoose.Types.ObjectId };

// Schema for updating a class
export const updateClassSchema = z.object({
    courseId: z.string().min(1, "At least one course is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid courseId is required"
    }).optional(),
    className: z.string().min(1).max(100).optional(),
    teacherId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid teacherId (userId) is required"
    }).min(1).optional(),
    capacity: z.number().min(1).max(500).optional(),
    currentEnrollment: z.number().min(0).optional(),
    status: z.enum(ClassStatus).optional(),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    classroom: z.string().optional(),
    meta: z.any().optional(),
});

export const updateClassSchemaWithId = updateClassSchema.extend({
    classId: z.string().min(1, "Class ID is required").refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Valid classId is required"
    }),
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

