import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '@/constants/http';
import { CourseModel, EnrollmentModel, SemesterModel } from '@/models';
import { EnrollmentStatus, ISemesterStatistics, Role } from '@/types';
import appAssert from '@/utils/appAssert';
import { Types } from 'mongoose';
import { ICreateSemesterParams, IUpdateSemesterParams } from '@/validators/semester.schemas';


/**
 * Create a new semester in the database.
 * @param  input - The input data for creating a semester.
 * @returns  - A promise that resolves with the created ISemester object.
 * @throws  - If a semester with the same year and type already exists.
 */
export const createSemester = async (input: ICreateSemesterParams) => {
  const existingSemester = await SemesterModel.findOne({ year: input.year, type: input.type });

  appAssert(!existingSemester, BAD_REQUEST, 'Semester already exists');

  const data = await SemesterModel.create(input);
  return data;
};

/**
 * List all semesters in the database.
 * Semesters are sorted by year in descending order and createdAt in descending order.
 * @returns  A promise that resolves with an array of ISemester objects.
 */
export const listAllSemesters = async () => {
  const data = await SemesterModel.find().sort({ year: -1, createdAt: -1 }).lean();

  return data;
};

/**
 * Update a semester in the database.
 * @param  input - The input data for updating a semester.
 * @returns  A promise that resolves with the updated ISemester object.
 * @throws  If a semester with the same year and type already exists.
 */
export const updateSemester = async (input: IUpdateSemesterParams) => {
  const { semesterId, type, year, startDate, endDate } = input;

  const semester = await SemesterModel.findById(semesterId);
  appAssert(semester, NOT_FOUND, 'Semester not found');

  // Prepare updated fields
  const newType = type ?? semester.type;
  const newYear = year ?? semester.year;

  // Check duplicate (exclude current)
  const existingSemester = await SemesterModel.findOne({
    year: newYear,
    type: newType,
    _id: { $ne: semesterId },
  });

  appAssert(!existingSemester, BAD_REQUEST, 'Semester already exists');

  // Apply changes
  semester.type = newType;
  semester.year = newYear;

  if (startDate) semester.startDate = startDate;
  if (endDate) semester.endDate = endDate;

  // Save & return updated document
  const updated = await semester.save();
  return updated;
};

/**
 * Delete a semester in the database.
 * @param  semesterId The ID of the semester to be deleted.
 * @returns  A promise that resolves with the deleted ISemester object.
 * @throws  If the semester has courses, it cannot be deleted.
 */
export const deleteSemester = async (semesterId: string) => {
  // 1. Check semester exists
  const semester = await SemesterModel.findById(semesterId);
  appAssert(semester, NOT_FOUND, 'Semester not found');

  // 2. Check if semester has courses
  const hasCourse = await CourseModel.exists({ semesterId });
  appAssert(!hasCourse, BAD_REQUEST, 'Semester has courses, can not delete');

  // 3. Delete
  const data = await SemesterModel.findByIdAndDelete(semesterId);
  return data;
};

/**
 * Get statistics for a specific semester.
 * @param semesterId - The ID of the semester
 * @param userId - The ID of the current user (optional)
 * @param userRole - The role of the current user (optional)
 * @returns A promise that resolves with semester statistics
 * @throws If semester not found or user doesn't have permission
 */
export const getSemesterStatistics = async (
  semesterId: string,
  userId?: Types.ObjectId,
  userRole?: Role
): Promise<ISemesterStatistics> => {
  // 1. Validate semesterId format
  appAssert(
    semesterId && semesterId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    'Invalid semester ID format'
  );

  // 2. Get semester info
  const semester = await SemesterModel.findById(semesterId).lean();
  appAssert(semester, NOT_FOUND, 'Semester not found');

  // 3. Get all courses in this semester (not deleted)
  const courses = await CourseModel.find({
    semesterId: semesterId,
    isDeleted: false,
  })
    .populate('teacherIds', '_id fullname')
    .populate('subjectId', '_id name code')
    .select('_id title status teacherIds subjectId')
    .lean();

  // 4. Check permission for Teachers
  if (userRole === Role.TEACHER) {
    const isTeachingInSemester = courses.some((course: any) =>
      course.teacherIds.some((teacher: any) => teacher._id.equals(userId))
    );
    appAssert(
      isTeachingInSemester,
      FORBIDDEN,
      "You don't have permission to view statistics for this semester"
    );
  }

  // 5. Get all enrollments for courses in this semester
  const courseIds = courses.map((course) => course._id);
  const enrollments = await EnrollmentModel.find({
    courseId: { $in: courseIds },
    status: { $in: [EnrollmentStatus.APPROVED, EnrollmentStatus.COMPLETED, EnrollmentStatus.DROPPED] },
  })
    .select('studentId courseId finalGrade status')
    .lean();

  // 6. Calculate statistics
  const uniqueStudents = new Set(enrollments.map((e: any) => e.studentId.toString()));
  const uniqueTeachers = new Set();
  const uniqueSubjects = new Set(); // Keep for backward compatibility if needed, but we'll use subjectMap
  const subjectMap = new Map<string, { name: string; code: string; count: number }>();

  courses.forEach((course: any) => {
    course.teacherIds.forEach((teacher: any) => {
      uniqueTeachers.add(teacher._id.toString());
    });
    if (course.subjectId) {
      const subjectId = course.subjectId._id.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          name: course.subjectId.name,
          code: course.subjectId.code,
          count: 0
        });
      }
      subjectMap.get(subjectId)!.count++;
    }
  });

  const subjects = Array.from(subjectMap.entries()).map(([id, info]) => ({
    subjectId: id,
    name: info.name,
    code: info.code,
    courseCount: info.count
  }));

  // Calculate grade statistics (only for completed enrollments)
  const completedEnrollments = enrollments.filter(
    (e: any) => e.status === EnrollmentStatus.COMPLETED && e.finalGrade != null
  );
  const droppedEnrollments = enrollments.filter((e: any) => e.status === EnrollmentStatus.DROPPED);

  const totalGrades = completedEnrollments.reduce((sum: number, e: any) => sum + (e.finalGrade || 0), 0);
  const averageFinalGrade = completedEnrollments.length > 0 ? totalGrades / completedEnrollments.length : 0;

  const passedCount = completedEnrollments.filter((e: any) => e.finalGrade >= 50).length;
  const passRate = enrollments.length > 0 ? (passedCount / enrollments.length) * 100 : 0;
  const dropRate = enrollments.length > 0 ? (droppedEnrollments.length / enrollments.length) * 100 : 0;

  // 7. Calculate course stats
  const courseStats = courses.map((course: any) => {
    const courseEnrollments = enrollments.filter((e: any) => e.courseId.equals(course._id));
    const courseCompleted = courseEnrollments.filter(
      (e: any) => e.status === EnrollmentStatus.COMPLETED && e.finalGrade != null
    );
    const avgGrade =
      courseCompleted.length > 0
        ? courseCompleted.reduce((sum: number, e: any) => sum + (e.finalGrade || 0), 0) /
        courseCompleted.length
        : 0;

    return {
      courseId: course._id.toString(),
      title: course.title,
      subjectCode: course.subjectId?.code,
      subjectName: course.subjectId?.name,
      status: course.status,
      studentCount: courseEnrollments.length,
      averageGrade: Math.round(avgGrade * 100) / 100,
    };
  });

  // 8. Get top 5 courses by student count
  const topCourses = [...courseStats]
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 5)
    .map((c) => ({
      courseId: c.courseId,
      title: c.title,
      studentCount: c.studentCount,
      averageGrade: c.averageGrade,
    }));

  // 9. Return statistics
  return {
    semesterId: semester._id.toString(),
    semesterName: semester.name || '',
    year: semester.year || 0,
    type: semester.type,
    totalCourses: courses.length,
    totalStudents: uniqueStudents.size,
    totalTeachers: uniqueTeachers.size,
    totalSubjects: subjects.length,
    subjects,
    averageFinalGrade: Math.round(averageFinalGrade * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    dropRate: Math.round(dropRate * 100) / 100,
    topCourses,
    courses: courseStats.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      subjectCode: c.subjectCode,
      subjectName: c.subjectName,
      status: c.status,
      studentCount: c.studentCount,
    })),
  };
};
