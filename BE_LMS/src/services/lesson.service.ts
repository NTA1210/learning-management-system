import mongoose from "mongoose";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import appAssert from "../utils/appAssert";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
  FORBIDDEN,
} from "../constants/http";
import { CreateLessonSchema, LessonQuerySchema } from "@/validators/lesson.schemas";
import { Role } from "../types";


export const getLessons = async (query: any, userId?: string, userRole?: Role) => {
  // Validate query parameters using schema
  const validatedQuery = LessonQuerySchema.parse(query);
 
  const filter: any = {};
  
  // Basic filters
  if (validatedQuery.title) {
    filter.title = { $regex: validatedQuery.title, $options: 'i' }; 
  }
  
  if (validatedQuery.content) {
    filter.content = { $regex: validatedQuery.content, $options: 'i' };
  }
  
  if (validatedQuery.order !== undefined) {
    filter.order = validatedQuery.order;
  }
  
  if (validatedQuery.durationMinutes !== undefined) {
    filter.durationMinutes = validatedQuery.durationMinutes;
  }
  
  if (validatedQuery.publishedAt) {
    filter.publishedAt = validatedQuery.publishedAt;
  }
  
  if (validatedQuery.courseId) {
    filter.courseId = validatedQuery.courseId;
  }

  // Full-text search
  if (validatedQuery.search) {
    filter.$text = { $search: validatedQuery.search };
  }

  // Access control based on user role and publishedAt field
  if (userRole === Role.STUDENT) {
    // Students can only see lessons with publishedAt date (published lessons)
    // and lessons from enrolled courses
    const enrolledCourses = await EnrollmentModel.find({ 
      studentId: userId, 
      status: 'active' 
    }).select('courseId');
    
    const enrolledCourseIds = enrolledCourses.map(enrollment => enrollment.courseId);
    
    filter.$or = [
      { publishedAt: { $exists: true, $ne: null } }, // Published lessons
      { courseId: { $in: enrolledCourseIds }, publishedAt: { $exists: true, $ne: null } }
    ];
  } else if (userRole === Role.TEACHER) {
    // Teachers can see their own lessons (any publishedAt status) and published lessons
    const teacherCourses = await CourseModel.find({ 
      teachers: userId 
    }).select('_id');
    
    const teacherCourseIds = teacherCourses.map(course => course._id);
    
    filter.$or = [
      { courseId: { $in: teacherCourseIds } }, // Own lessons
      { publishedAt: { $exists: true, $ne: null } } // Published lessons
    ];
  }
  // Admin can see everything (no additional filter)

  // Pagination
  const page = validatedQuery.page;
  const limit = validatedQuery.limit;
  const skip = (page - 1) * limit;

  const [lessons, total] = await Promise.all([
    LessonModel.find(filter)
      .populate('courseId', 'title description isPublished teachers') 
      .sort(validatedQuery.search ? { score: { $meta: 'textScore' } } : { order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LessonModel.countDocuments(filter)
  ]);

  // Add access information for each lesson
  const lessonsWithAccess = await Promise.all(lessons.map(async (lesson) => {
    let hasAccess = false;
    let accessReason = '';

    if (userRole === Role.ADMIN) {
      hasAccess = true;
      accessReason = 'admin';
    } else if (userRole === Role.TEACHER) {
      // Check if teacher is instructor of the course
      const isInstructor = (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
      if (isInstructor) {
        hasAccess = true;
        accessReason = 'instructor';
      } else if (lesson.publishedAt) {
        hasAccess = true;
        accessReason = 'published';
      }
    } else if (userRole === Role.STUDENT) {
      // Check if student is enrolled in the course
      const enrollment = await EnrollmentModel.findOne({
        studentId: userId,
        courseId: lesson.courseId._id,
        status: 'active'
      });
      
      if (enrollment) {
        hasAccess = true;
        accessReason = 'enrolled';
      } else if (lesson.publishedAt) {
        hasAccess = true;
        accessReason = 'published';
      } else {
        hasAccess = false;
        accessReason = 'not_enrolled';
      }
    }

    return {
      ...lesson,
      hasAccess,
      accessReason
    };
  }));

  return {
    lessons: lessonsWithAccess,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

export const getLessonsByCourse = async (courseId: string, userId?: string, userRole?: Role) => {
  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    appAssert(false, NOT_FOUND, "Invalid course ID format");
  }

  // Check if course exists
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");
  
  // Access control based on user role
  if (userRole === Role.STUDENT) {
    // Students must be enrolled in the course
    // const enrollment = await EnrollmentModel.findOne({
    //   studentId: userId,
    //   courseId: courseId,
    //   status: 'active'
    // });
    // appAssert(enrollment, FORBIDDEN, "Not enrolled in this course");
    
    // Students can only see published lessons
    const lessons = await LessonModel.find({ 
      courseId, 
      publishedAt: { $exists: true, $ne: null } 
    })
    .populate('courseId', 'title description')
    .sort({ order: 1 })
    .lean();
    
    return lessons.map(lesson => ({
      ...lesson,
      hasAccess: true,
      accessReason: 'enrolled'
    }));
    
  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = course.teachers.includes(new mongoose.Types.ObjectId(userId));
    
    if (isInstructor) {
      // Instructors can see all lessons (published and unpublished)
      const lessons = await LessonModel.find({ courseId })
        .populate('courseId', 'title description')
        .sort({ order: 1 })
        .lean();
        
      return lessons.map(lesson => ({
        ...lesson,
        hasAccess: true,
        accessReason: 'instructor'
      }));
    } else {
      // Non-instructor teachers can only see published lessons
      const lessons = await LessonModel.find({ 
        courseId, 
        publishedAt: { $exists: true, $ne: null } 
      })
      .populate('courseId', 'title description')
      .sort({ order: 1 })
      .lean();
      
      return lessons.map(lesson => ({
        ...lesson,
        hasAccess: true,
        accessReason: 'published'
      }));
    }
    
  } else if (userRole === Role.ADMIN) {
    // Admins can see all lessons
    const lessons = await LessonModel.find({ courseId })
      .populate('courseId', 'title description')
      .sort({ order: 1 })
      .lean();
      
    return lessons.map(lesson => ({
      ...lesson,
      hasAccess: true,
      accessReason: 'admin'
    }));
  }
  
  // If no user role or invalid role, return empty array
  return [];
};

export const getLessonById = async (id: string, userId?: string, userRole?: Role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid lesson ID format");
  }
  
  const lesson = await LessonModel.findById(id)
    .populate('courseId', 'title description isPublished teachers')
    .lean();
    
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Check access permissions
  let hasAccess = false;
  let accessReason = '';

  if (userRole === Role.ADMIN) {
    hasAccess = true;
    accessReason = 'admin';
  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    if (isInstructor) {
      hasAccess = true;
      accessReason = 'instructor';
    } else if (lesson.publishedAt) {
      hasAccess = true;
      accessReason = 'published';
    }
  } else if (userRole === Role.STUDENT) {
    // Check if student is enrolled in the course
    const enrollment = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: lesson.courseId._id,
      status: 'active'
    });
    
    if (enrollment) {
      hasAccess = true;
      accessReason = 'enrolled';
    } else if (lesson.publishedAt) {
      hasAccess = true;
      accessReason = 'published';
    }
  }

  // If no access, only return basic info
  if (!hasAccess) {
    return {
      ...lesson,
      content: undefined, // Hide content
      hasAccess: false,
      accessReason: 'not_enrolled',
      message: 'You need to enroll in this course to access the lesson content'
    };
  }

  return {
    ...lesson,
    hasAccess: true,
    accessReason
  };
};