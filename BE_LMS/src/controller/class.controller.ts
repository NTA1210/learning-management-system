import { catchErrors } from "../utils/asyncHandler";
import { OK, CREATED } from "../constants/http";
import {
  createClassSchema,
  updateClassSchema,
  classIdSchema,
  courseIdSchema,
  teacherIdSchema,
  studentIdSchema,
} from "../validators/class.schemas";
import {
  getClassById,
  getClassesByCourse,
  createClass,
  updateClassById,
  getTeacherClasses,
  getStudentClasses,
  deleteClassById,
} from "../services/class.service";
import mongoose from "mongoose";

/**
 * Create a new class for a course
 * POST /classes
 * Admin only
 */
export const createClassHandler = catchErrors(async (req, res) => {
  // Validate request body
  const data = createClassSchema.parse(req.body);

  const userId = req.userId!.toString(); // From authenticate middleware

  // Call service
  const newClass = await createClass({
    ...data,
    createdBy: userId,
  });

  return res.success(CREATED, {
    message: "Class created successfully",
    data: newClass,
  });
});

/**
 * Get all classes for a course
 * GET /courses/:courseId/classes
 */
export const getClassesByCourseHandler = catchErrors(async (req, res) => {
  // Validate course ID param
  const courseId = courseIdSchema.parse(req.params.courseId);
  const { status } = req.query;

  // Call service
  const classes = await getClassesByCourse(courseId, status as string);

  return res.success(OK, {
    message: "Classes retrieved successfully",
    data: classes,
  });
});

/**
 * Get a specific class by ID
 * GET /classes/:classId
 */
export const getClassByIdHandler = catchErrors(async (req, res) => {
  // Validate class ID param
  const classId = classIdSchema.parse(req.params.classId);

  // Call service
  const classData = await getClassById(classId);

  return res.success(OK, {
    message: "Class retrieved successfully",
    data: classData,
  });
});

/**
 * Update class information
 * PATCH /classes/:classId
 * Admin only
 */
export const updateClassHandler = catchErrors(async (req, res) => {
  // Validate class ID param
  const classId = classIdSchema.parse(req.params.classId);
  // Validate request body
  const data = updateClassSchema.parse(req.body);

  // Call service
  const updatedClass = await updateClassById(classId, {...data, teacherIds: data.teacherIds as unknown as mongoose.Types.ObjectId[]});

  return res.success(OK, {
    message: "Class updated successfully",
    data: updatedClass,
  });
});

/**
 * Get teacher's classes
 * GET /teachers/:teacherId/classes
 */
export const getTeacherClassesHandler = catchErrors(async (req, res) => {
  // Validate teacher ID param
  const teacherId = teacherIdSchema.parse(req.params.teacherId);
  const { status, semester } = req.query;

  // Call service
  const classes = await getTeacherClasses(
    teacherId,
    status as string,
    semester as string
  );

  return res.success(OK, {
    message: "Teacher classes retrieved successfully",
    data: classes,
  });
});

/**
 * Get student's enrolled classes
 * GET /students/:studentId/classes
 */
export const getStudentClassesHandler = catchErrors(async (req, res) => {
  // Validate student ID param
  const studentId = studentIdSchema.parse(req.params.studentId);

  // Call service
  const classes = await getStudentClasses(studentId);

  return res.success(OK, {
    message: "Student classes retrieved successfully",
    data: classes,
  });
});

/**
 * Delete a class
 * DELETE /classes/:classId
 * Admin only
 */
export const deleteClassHandler = catchErrors(async (req, res) => {
  // Validate class ID param
  const classId = classIdSchema.parse(req.params.classId);

  // Call service
  await deleteClassById(classId);

  return res.success(OK, {
    message: "Class deleted successfully",
  });
});

