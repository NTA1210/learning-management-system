import { NOT_FOUND, BAD_REQUEST, CONFLICT } from "../constants/http";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";

// Ensure models are registered
void CourseModel;
void UserModel;

// GET - Get enrollment by ID
export const getEnrollmentById = async (enrollmentId: string) => {
  const enrollment = await EnrollmentModel.findById(enrollmentId)
    .populate("studentId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  appAssert(enrollment, NOT_FOUND, "Enrollment not found");
  return enrollment;
};

// GET - Get all enrollments for a student
export const getStudentEnrollments = async (filters: {
  studentId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { studentId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = { studentId };
  if (status) {
    query.status = status;
  }

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("courseId", "title code description category teachers isPublished")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET - Get all enrollments for a course
export const getCourseEnrollments = async (filters: {
  courseId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { courseId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Check if course exists
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  const query: any = { courseId };
  if (status) {
    query.status = status;
  }

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("studentId", "username email fullname avatar_url")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET - Get all enrollments (admin view)
export const getAllEnrollments = async (filters: {
  status?: string;
  courseId?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, courseId, studentId, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (status) query.status = status;
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("studentId", "username email fullname avatar_url")
      .populate("courseId", "title code description")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// POST - Create enrollment (dùng chung cho admin và student)
export const createEnrollment = async (data: {
  studentId: string;
  courseId: string;
  status?: "active" | "completed" | "dropped";
  role?: "student" | "auditor";
}) => {
  const { studentId, courseId, status = "active", role = "student" } = data;

  // 1. Check student exists
  const student = await UserModel.findById(studentId);
  appAssert(student, NOT_FOUND, "Student not found");

  // 2. Check course exists and is published
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");
  appAssert(course.isPublished, BAD_REQUEST, "Course is not published");

  // 3. Check duplicate enrollment
  const existingEnrollment = await EnrollmentModel.findOne({
    studentId,
    courseId,
  });
  appAssert(!existingEnrollment, CONFLICT, "Already enrolled in this course");

  // 4. Check course capacity
  if (course.capacity) {
    const enrolledCount = await EnrollmentModel.countDocuments({
      courseId,
      status: "active",
    });
    appAssert(
      enrolledCount < course.capacity,
      BAD_REQUEST,
      "Course is full"
    );
  }

  // 5. Create enrollment
  const enrollment = await EnrollmentModel.create({
    studentId,
    courseId,
    status,
    role,
  });

  // Populate để trả về đầy đủ thông tin
  await enrollment.populate([
    { path: "studentId", select: "username email fullname avatar_url" },
    { path: "courseId", select: "title code description" },
  ]);

  return enrollment;
};
