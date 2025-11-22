import { IQuizAttempt, IUser } from '@/types';

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

export const findMinMax = (scores: number[]) => {
  if (!scores || scores.length === 0) return null;
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
  };
};

export function standardDeviation(scores: number[]): number | null {
  if (!scores || scores.length === 0) return null;

  const n = scores.length;
  const mean = calculateMedian(scores);
  const variance = scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}

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
