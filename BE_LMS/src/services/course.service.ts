import CourseModel from "../models/course.model";
import { ListCoursesQuery } from "../validators/course.schemas";

export type ListCoursesParams = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: string;
};

export const listCourses = async ({
  page,
  limit,
  search,
  category,
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

