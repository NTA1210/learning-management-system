import mongoose from "mongoose";

export const prefixLessonMaterial = (
  courseId: mongoose.Types.ObjectId,
  lessonId: mongoose.Types.ObjectId
) => {
  return `courses/${courseId}/lessons/${lessonId}`;
};

export const prefixSubmission = (
  courseId: string,
  assignmentId: string,
  studentId: string
) => {
  return `courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`;
};

export const prefixQuizQuestionImage = (
  subjectId: string,
  questionId: string
) => {
  return `subjects/${subjectId}/questions/${questionId}/image`;
};

export const prefixCourseLogo = (courseId: string) => {
  return `courses/${courseId}/logo`;
};