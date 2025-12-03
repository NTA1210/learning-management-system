import { FORBIDDEN } from '@/constants/http';
import { ICourse, IQuizAttempt, IUser } from '@/types';
import appAssert from '@/utils/appAssert';
import mongoose from 'mongoose';

/**
 * Calculate the median of an array of numbers.
 * If the array is empty, returns 0.
 * If the array has an odd number of elements, returns the middle element.
 * If the array has an even number of elements, returns the average of the two middle elements.
 * @param scores - An array of numbers
 * @returns The median of the array
 */
export function calculateMedian(scores: number[]): number {
  if (!scores || scores.length === 0) return 0;

  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);

  if (n % 2 === 1) {
    return sorted[mid];
  } else {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

/**
 * Finds the minimum and maximum values in an array of numbers.
 * @param scores - An array of numbers
 * @returns An object containing the minimum and maximum values, or null if the array is empty
 */
export const findMinMax = (scores: number[]) => {
  if (!scores || scores.length === 0) return null;
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
  };
};

/**
 * Calculates the standard deviation of an array of numbers.
 * The standard deviation is a measure of the amount of variation or dispersion of a set of values.
 * A low standard deviation indicates that the values tend to be close to the mean of the set,
 * while a high standard deviation indicates that the values are spread out over a wider range.
 * @param scores - An array of numbers
 * @returns The standard deviation of the array, or null if the array is empty
 */
export function standardDeviation(scores: number[]): number | null {
  if (!scores || scores.length === 0) return null;

  const n = scores.length;
  const mean = calculateMedian(scores);
  const variance = scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}

/**
 * Calculate the rank of each student based on their score and duration.
 * Students with higher scores will have a higher rank, and students with the same score will be ranked by their duration (students with shorter durations will have a higher rank).
 * @param quizAttempt - An array of quiz attempts with student information
 * @returns An array of student information with their rank
 */
export const calculateRank = (quizAttempt: (IQuizAttempt & { studentId: IUser })[]) => {
  const sortedAttempts = [...quizAttempt].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.durationSeconds - b.durationSeconds;
  });

  return sortedAttempts.map((attempt, index) => {
    return {
      studentId: (attempt.studentId as any).id,
      fullname: (attempt.studentId as any).fullname,
      email: (attempt.studentId as any).email,
      score: attempt.score,
      durationSeconds: attempt.durationSeconds,
      rank: index + 1,
    };
  });
};

export const isTeacherOfCourse = (course: ICourse, teacherId: mongoose.Types.ObjectId) => {
  const isTeacherOfCourse = (course.teacherIds || []).some((id: mongoose.Types.ObjectId) =>
    id.equals(teacherId)
  );

  appAssert(isTeacherOfCourse, FORBIDDEN, 'You are not a teacher of this course');

  return isTeacherOfCourse;
};
