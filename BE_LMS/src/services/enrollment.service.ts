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
    .populate("userId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  appAssert(enrollment, NOT_FOUND, "Enrollment not found");
  return enrollment;
};

// GET - Get all enrollments for a student
export const getStudentEnrollments = async (filters: {
  userId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { userId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = { userId };
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
      .populate("userId", "username email fullname avatar_url")
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
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, courseId, userId, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (status) query.status = status;
  if (courseId) query.courseId = courseId;
  if (userId) query.userId = userId;

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("userId", "username email fullname avatar_url")
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
  userId: string;
  courseId: string;
  status?: "active" | "completed" | "dropped";
  role?: "student" | "auditor";
}) => {
  const { userId, courseId, status = "active", role = "student" } = data;

  // 1. Check student exists
  const student = await UserModel.findById(userId);
  appAssert(student, NOT_FOUND, "Student not found");

  // 2. Check course exists and is published
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");
  appAssert(course.isPublished, BAD_REQUEST, "Course is not published");

  // 3. Check existing enrollment
  const existingEnrollment = await EnrollmentModel.findOne({
    userId,
    courseId,
  });

  // Nếu đã có enrollment
  if (existingEnrollment) {
    // Nếu status = "dropped" → CHO PHÉP re-enroll (update lại thành active)
    if (existingEnrollment.status === "dropped") {
      existingEnrollment.status = status;
      existingEnrollment.role = role;
      existingEnrollment.enrolledAt = new Date(); // Reset enrollment date
      existingEnrollment.finalGrade = undefined; // Reset grade
      existingEnrollment.grades = []; // Reset grades
      await existingEnrollment.save();

      await existingEnrollment.populate([
        { path: "userId", select: "username email fullname avatar_url" },
        { path: "courseId", select: "title code description" },
      ]);

      return existingEnrollment;
    }

    // Nếu status = "active" hoặc "completed" → KHÔNG CHO PHÉP
    appAssert(
      false,
      CONFLICT,
      "Already enrolled in this course"
    );
  }

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
    userId,
    courseId,
    status,
    role,
  });

  // Populate để trả về đầy đủ thông tin
  await enrollment.populate([
    { path: "userId", select: "username email fullname avatar_url" },
    { path: "courseId", select: "title code description" },
  ]);

  return enrollment;
};

// PUT - Update enrollment (Admin/Teacher)
export const updateEnrollment = async (
  enrollmentId: string,
  data: {
    status?: "active" | "completed" | "dropped";
    role?: "student" | "auditor";
    finalGrade?: number;
  }
) => {
  // 1. Check enrollment exists
  const enrollment = await EnrollmentModel.findById(enrollmentId);
  appAssert(enrollment, NOT_FOUND, "Enrollment not found");

  // 2. Update fields
  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.finalGrade !== undefined) updateData.finalGrade = data.finalGrade;

  // 3. Update enrollment
  const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
    enrollmentId,
    updateData,
    { new: true } // Return updated document
  )
    .populate("userId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  return updatedEnrollment;
};

// PUT - Student update own enrollment (chỉ có thể drop)
export const updateSelfEnrollment = async (
  enrollmentId: string,
  userId: string,
  data: {
    status?: "dropped";
  }
) => {
  // 1. Check enrollment exists và thuộc về student này
  const enrollment = await EnrollmentModel.findOne({
    _id: enrollmentId,
    userId,
  });
  appAssert(enrollment, NOT_FOUND, "Enrollment not found or access denied");

  // 2. Không cho phép drop nếu đã completed
  appAssert(
    enrollment.status !== "completed",
    BAD_REQUEST,
    "Cannot drop a completed course"
  );

  // 3. Update status
  const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
    enrollmentId,
    { status: data.status },
    { new: true }
  )
    .populate("userId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  return updatedEnrollment;
};
