import mongoose from "mongoose";

export enum SemesterType {
  SUMMER = "summer",
  FALL = "fall",
  SPRING = "spring",
}

export default interface ISemester extends mongoose.Document {
  name?: string;
  year?: number;
  type: SemesterType;
  startDate: Date;
  endDate: Date;
}

export interface ISemesterStatistics {
  semesterId: string;
  semesterName: string;
  year: number;
  type: SemesterType;
  totalCourses: number;
  totalStudents: number; // unique students
  totalTeachers: number; // unique teachers
  totalSubjects: number; // unique subjects
  subjects: Array<{
    subjectId: string;
    name: string;
    code: string;
    courseCount: number;
  }>;
  averageFinalGrade: number;
  passRate: number; // percentage
  dropRate: number; // percentage
  topCourses: Array<{
    courseId: string;
    title: string;
    studentCount: number;
    averageGrade: number;
  }>;
  courses: Array<{
    courseId: string;
    title: string;
    subjectCode?: string;
    subjectName?: string;
    status: string;
    studentCount: number;
  }>;
}

