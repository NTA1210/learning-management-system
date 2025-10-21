import { FORBIDDEN, NOT_FOUND } from "../constants/http";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";

// Ensure models are registered
void CourseModel;
void UserModel;

// GET - Get enrollment by ID
export const getEnrollmentById = async (
  enrollmentId: string,
  requestUserId: string
) => {
  const enrollment = await EnrollmentModel.findById(enrollmentId)
    .populate("studentId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  appAssert(enrollment, NOT_FOUND, "Enrollment not found");

  // Get requesting user info
  const requestUser = await UserModel.findById(requestUserId);
  appAssert(requestUser, NOT_FOUND, "User not found");

  // Check permission
  const isAdmin = requestUser.role === "ADMIN";
  const isOwnEnrollment = enrollment.studentId._id.toString() === requestUserId;

  // Check if teacher of the course
  const course = await CourseModel.findById(enrollment.courseId);
  const isTeacher =
    course &&
    course.teachers.some((teacherId) => teacherId.toString() === requestUserId);

  appAssert(
    isAdmin || isOwnEnrollment || isTeacher,
    FORBIDDEN,
    "You don't have permission to view this enrollment"
  );

  return enrollment;
};

// GET - Get all enrollments for a student
export const getStudentEnrollments = async (filters: {
  studentId: string;
  requestUserId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { studentId, requestUserId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Get requesting user info
  const requestUser = await UserModel.findById(requestUserId);
  appAssert(requestUser, NOT_FOUND, "User not found");

  // Check permission
  const isAdmin = requestUser.role === "ADMIN";
  const isOwnProfile = studentId === requestUserId;

  // If not admin and not own profile, check if teacher of any enrolled course
  if (!isAdmin && !isOwnProfile) {
    const isTeacher = requestUser.role === "teacher";
    appAssert(isTeacher, FORBIDDEN, "You don't have permission to view this student's enrollments");
    
    // Teacher can view, but we don't restrict further here
    // In real app, might want to check if teacher teaches any of student's courses
  }

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
  requestUserId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { courseId, requestUserId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Get requesting user info
  const requestUser = await UserModel.findById(requestUserId);
  appAssert(requestUser, NOT_FOUND, "User not found");

  // Check if course exists
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  // Check permission
  const isAdmin = requestUser.role === "ADMIN";
  const isTeacher = course.teachers.some(
    (teacherId) => teacherId.toString() === requestUserId
  );
  
  // Check if student is enrolled in this course
  const isEnrolledStudent = await EnrollmentModel.exists({
    courseId,
    studentId: requestUserId,
    status: "active",
  });

  appAssert(
    isAdmin || isTeacher || isEnrolledStudent,
    FORBIDDEN,
    "You don't have permission to view this course's enrollments"
  );

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
  requestUserId: string;
  status?: string;
  courseId?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}) => {
  const { requestUserId, status, courseId, studentId, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Get requesting user info
  const requestUser = await UserModel.findById(requestUserId);
  appAssert(requestUser, NOT_FOUND, "User not found");

  // Only admin can view all enrollments
  appAssert(
    requestUser.role === "ADMIN",
    FORBIDDEN,
    "Only admins can view all enrollments"
  );

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

