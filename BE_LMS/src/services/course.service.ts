import CourseModel from "../models/course.model";
import CategoryModel from "../models/category.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, BAD_REQUEST } from "../constants/http";
import { CreateCourseInput } from "../validators/course.schemas";

export type ListCoursesParams = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  teacherId?: string;
  code?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: string;
};

export const listCourses = async ({
  page,
  limit,
  search,
  category,
  teacherId,
  code,
  isPublished,
  sortBy = "createdAt",
  sortOrder = "desc",
}: ListCoursesParams) => {
  // Build filter query
  const filter: any = {};

  // Filter by published status
  if (isPublished !== undefined) {
    filter.isPublished = isPublished;
  }

  // Filter by category
  if (category) {
    filter.category = category;
  }

  // Filter by teacher ID
  if (teacherId) {
    filter.teachers = teacherId;
  }

  // Filter by course code (exact match, case-insensitive)
  if (code) {
    filter.code = { $regex: `^${code}$`, $options: "i" };
  }

  // Search by title or description (text search)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query with pagination
  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .populate("category", "name slug description")
      .populate("teachers", "username email fullname avatar_url")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    courses,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

// Get course by ID
export const getCourseById = async (courseId: string) => {
  const course = await CourseModel.findById(courseId)
    .populate("category", "name slug description")
    .populate("teachers", "username email fullname avatar_url bio")
    .lean();

  appAssert(course, NOT_FOUND, "Course not found");

  return course;
};

// Create new course
export const createCourse = async (data: CreateCourseInput) => {
  // Validate category exists if provided
  if (data.category) {
    const categoryExists = await CategoryModel.findById(data.category);
    appAssert(categoryExists, BAD_REQUEST, "Category not found");
  }

  // Validate all teachers exist
  const teachers = await UserModel.find({
    _id: { $in: data.teachers },
  });

  appAssert(
    teachers.length === data.teachers.length,
    BAD_REQUEST,
    "One or more teachers not found"
  );

  // Check if all users have teacher or admin role
  const allAreTeachers = teachers.every(
    (teacher) => teacher.role === "teacher" || teacher.role === "ADMIN"
  );
  appAssert(
    allAreTeachers,
    BAD_REQUEST,
    "All assigned users must have teacher or admin role"
  );

  // Create course
  const course = await CourseModel.create(data);

  // Populate and return
  const populatedCourse = await CourseModel.findById(course._id)
    .populate("category", "name slug description")
    .populate("teachers", "username email fullname avatar_url")
    .lean();

  return populatedCourse;
};


