import {catchErrors} from "../utils/asyncHandler";
import {OK, CREATED} from "../constants/http";
import {
    updateClassSchema,
    classIdSchema,
    courseIdSchema,
    teacherIdSchema,
    studentIdSchema, createEmptyClassesSchema, assignStudentsToClassesSchema, updateClassSchemaWithId,
} from "../validators/class.schemas";
import {
    getClassById,
    getClassesByCourse,
    updateClassById,
    getTeacherClasses,
    getStudentClasses,
    deleteClassById, createEmptyClasses, assignStudentsIntoClasses,
} from "../services/class.service";

/**
 * Create empty classes for a course.
 * POST /classes/create.
 *
 * This function should only be run once at the beginning of a semester. Any subsequent runs will override all class data of that course.
 */
export const createEmptyClassesHandler = catchErrors(async (req, res) => {
    // Validate request body
    const {courseId, totalStudents} = createEmptyClassesSchema.parse(req.body);

    const userId = req.userId;
    // Call service
    const createdClasses = await createEmptyClasses(courseId, userId, totalStudents);

    return res.success(CREATED, {
        message: "Class created successfully",
        data: createdClasses,
    });
});

/**
 * Assign students to classes.
 * POST /classes/assign-students.
 */
export const assignStudentsToClassesHandler = catchErrors(async (req, res) => {
    // Validate request body
    const {classIds, courseId} = assignStudentsToClassesSchema.parse(req.body);

    // Call service
    const classes = await assignStudentsIntoClasses(classIds, courseId);

    return res.success(CREATED, {
        message: "Students assigned to classes successfully",
        data: classes,
    });
});

/**
 * Assign teacher to a class.
 * POST /classes/assign-teacher.
 */
export const assignTeacherToClassHandler = catchErrors(async (req, res) => {
    // Validate class ID param
    const {classId, teacherId} = updateClassSchemaWithId.parse(req.body);

    // Call service
    const updatedClass = await updateClassById(classId, {teacherId: teacherId as string});
    return res.success(OK, {
        message: "Teacher assigned to class successfully",
        data: updatedClass,
    });
});

/**
 * Assign teacher to a class and students to multiple classes.
 * POST /classes/assign-all.
 */
export const assignTeacherAndStudentsHandler = catchErrors(async (req, res) => {
    // Validate request body
    const {classId, teacherId} = updateClassSchemaWithId.parse(req.body);
    const {classIds, courseId} = assignStudentsToClassesSchema.parse(req.body);

    // Assign teacher to class
    const updatedClass = await updateClassById(classId, {teacherId: teacherId as string});

    // Assign students to classes
    const classes = await assignStudentsIntoClasses(classIds, courseId);

    return res.success(OK, {
        message: "Teacher and students assigned successfully",
        data: {
            updatedClass,
            classes,
        },
    });
});

/**
 * Get all classes for a course
 * GET /courses/:courseId/classes
 */
export const getClassesByCourseHandler = catchErrors(async (req, res) => {
    // Validate course ID param
    const courseId = courseIdSchema.parse(req.params.courseId);
    const {status} = req.query;

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
    const updatedClass = await updateClassById(classId, data);

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
    const {status, semester} = req.query;

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