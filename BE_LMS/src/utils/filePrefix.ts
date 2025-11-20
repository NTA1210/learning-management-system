import mongoose from "mongoose";

export const prefixLessonMaterial = (
  courseId: mongoose.Types.ObjectId,
  lessonId: mongoose.Types.ObjectId
) => {
  return `courses/${courseId}/lessons/${lessonId}`;
};

export const prefixSubmission = (
  courseId: string | import("mongoose").Types.ObjectId,
  assignmentId: string | import("mongoose").Types.ObjectId,
  studentId: string | import("mongoose").Types.ObjectId
) => {
  const cId =
    courseId && (courseId as any).toHexString
      ? (courseId as any).toHexString()
      : (courseId as string);
  const aId =
    assignmentId && (assignmentId as any).toHexString
      ? (assignmentId as any).toHexString()
      : (assignmentId as string);
  const sId =
    studentId && (studentId as any).toHexString
      ? (studentId as any).toHexString()
      : (studentId as string);

  return `courses/${cId}/assignments/${aId}/submissions/${sId}`;
};

export const prefixQuizQuestionImage = (
  subjectId: string,
  questionId: string
) => {
  return `subjects/${subjectId}/questions/${questionId}/image`;
};

export const prefixExternalQuizQuestionImage = (quizId: string) => {
  return `quizzes/${quizId}/external/image`;
};

export const prefixCourseLogo = (courseId: string) => {
  return `courses/${courseId}/logo`;
};

export const prefixUserAvatar = (userId: string) => {
  return `users/${userId}/avatar`;
};
