import z from "zod";
import mongoose from "mongoose";


const objectIdOrString = z.preprocess((val) => {
  if (!val) return val;
  if (typeof val === "string") return val;
  
  if (typeof val === "object" && (val as any).toHexString) return (val as any).toHexString();
  return val;
}, z.string().length(24, "Id is invalid"));

export const submissionBodySchema = z
  .object({
    assignmentId: z.string().length(24, "Assignment Id is invalid"),
    studentId: objectIdOrString,
    file: z.any(),
  });
  

export const gradeSubmissionSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  grade: z.number().min(0, "grade must be >= 0"),
  feedback: z.string().optional(),
});

// 
export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().length(24, "Assignment Id is invalid"),
});