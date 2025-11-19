import mongoose from "mongoose";
import z from "zod";

const quizIdSchema = z.string().length(24, "Invalid quiz ID");

export const enrollQuizSchema = z.object({
  quizId: quizIdSchema,
});

export type EnrollUserInfo = {
  userId: mongoose.Types.ObjectId;
  role: string;
  userAgent?: string | string[];
  ip?: string | null;
};

export type EnrollQuizInput = z.infer<typeof enrollQuizSchema> & {
  user: EnrollUserInfo;
};
