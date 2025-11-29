import mongoose from 'mongoose';

export enum EnrollmentStatus {
  /** Enrollment not approved to enroll in a course yet. */
  PENDING = 'pending',
  /** Enrollment approved to enroll in a course. */
  APPROVED = 'approved',
  /** Enrollment rejected to enroll in a course. */
  REJECTED = 'rejected',
  /** Student cancelled the enrollment. */
  CANCELLED = 'cancelled',
  /** Student failed the course they enrolled in. */
  DROPPED = 'dropped',
  /** Student completed the course they enrolled in. */
  COMPLETED = 'completed',
}

export enum EnrollmentRole {
  STUDENT = 'student',
  AUDITOR = 'auditor',
}

export enum EnrollmentMethod {
  SELF = 'self',
  INVITED = 'invited',
  PASSWORD = 'password',
  OTHER = 'other',
}

export interface IQuizDetails {
  quizId: mongoose.Types.ObjectId;
  title: string;
  score: number;
  isCompleted: boolean;
}

export interface IAssignmentDetails {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  score: number;
  isCompleted: boolean;
}

export default interface IEnrollment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  method: EnrollmentMethod;
  role?: EnrollmentRole;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  note?: string;
  progress: {
    totalLessons: number;
    completedLessons: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalQuizScores: number;
    quizDetails: IQuizDetails[];
    totalAssignments: number;
    completedAssignments: number;
    totalAssignmentScores: number;
    assignmentDetails: IAssignmentDetails[];
    totalAttendances: number;
    completedAttendances: number;
  };
  finalGrade?: number;
  completedAt?: Date;
  droppedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
