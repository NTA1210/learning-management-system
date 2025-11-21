import z from "zod";
import mongoose from "mongoose";


const objectIdAsObject = z.preprocess((val) => {
  if (!val) return val;
 
  if (typeof val === "object" && (val as any)?._bsontype === "ObjectID") return val;

  if (typeof val === "string" && mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return val;
}, z.instanceof(mongoose.Types.ObjectId));

export const submissionBodySchema = z.object({
  assignmentId: z.string().length(24, "Assignment Id is invalid"),
  studentId: objectIdAsObject,
  file: z.any(),
});
  

export const gradeSubmissionSchema = z.object({
  studentId: objectIdAsObject,
  grade: z.number().min(0, "grade must be >= 0"),
  feedback: z.string().optional(),
});

// 
export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().length(24, "Assignment Id is invalid"),
});