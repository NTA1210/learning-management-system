import AssignmentModel from "../models/assignment.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import AnnouncementModel from "../models/announcement.model";
import mongoose from "mongoose";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, FORBIDDEN } from "../constants/http";
import { EnrollmentStatus } from "../types/enrollment.type";
import { Role } from "../types";


const normalizeObjectId = (id?: mongoose.Types.ObjectId | null) => {
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
};

const ensureTeacherAccessToCourse = async ({
  course,
  courseId,
  userId,
  userRole,
}: {
  course?: any;
  courseId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userRole?: Role;
}) => {
  if (!userId || userRole !== Role.TEACHER) {
    return course;
  }

  const courseDoc =
    course ??
    (await CourseModel.findById(courseId).select("teacherIds title").lean());

  appAssert(courseDoc, NOT_FOUND, "Course not found");

  const teacherIdStr = normalizeObjectId(userId);
  const isTeacherInCourse =
    (courseDoc.teacherIds || []).some(
      (teacherId: mongoose.Types.ObjectId) =>
        teacherId.toString() === teacherIdStr
    ) || false;

  appAssert(
    isTeacherInCourse,
    FORBIDDEN,
    "You are not assigned to teach this course"
  );

  return courseDoc;
};

export type ListAssignmentsParams = {
  page: number;
  limit: number;
  courseId?: mongoose.Types.ObjectId;
  search?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  sortBy?: string;
  sortOrder?: string;
  userId?: mongoose.Types.ObjectId;
  userRole?: Role;
};

export const listAssignments = async ({
  page,
  limit,
  courseId,
  search,
  dueBefore,
  dueAfter,
  sortBy = "createdAt",
  sortOrder = "desc",
  userId,
  userRole,
}: ListAssignmentsParams) => {
  // Build filter query
  const filter: any = {};

  if (courseId) {
    filter.courseId = courseId;
  }

  const emptyResult = {
    assignments: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  //neu là std,ktra enrollment status
  if (userRole === Role.STUDENT && userId) {
    if (courseId) {
      const enrollment = await EnrollmentModel.findOne({
        studentId: userId,
        courseId: courseId,
        status: EnrollmentStatus.APPROVED,
      });
      appAssert(
        enrollment,
        FORBIDDEN,
        "You are not approved to access this course"
      );
    } else {
      //nếu không có courseId, chỉ list assignments của các course mà student đã được approved
      const approved = await EnrollmentModel.find({
        studentId: userId,
        status: EnrollmentStatus.APPROVED,
      }).select("courseId");
      const approvedCourseIds = approved.map((e: any) => e.courseId);
      //nếu approved courses, return empty
      if (!approvedCourseIds.length) {
        return emptyResult;
      }
      filter.courseId = { $in: approvedCourseIds };
    }
  }

  // nếu là teacher, chỉ xem được course của họ
  if (userRole === Role.TEACHER && userId) {
    if (courseId) {
      await ensureTeacherAccessToCourse({ courseId, userId, userRole });
    } else {
      const teacherCourses = await CourseModel.find({
        teacherIds: userId,
      })
        .select("_id")
        .lean();

      if (!teacherCourses.length) {
        return emptyResult;
      }

      const courseIds = teacherCourses.map((course: any) => course._id);
      filter.courseId = { $in: courseIds };
    }
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  // lọc theo cratedAt
  if (dueAfter || dueBefore) {
  filter.createdAt = {};
  if (dueAfter) filter.createdAt.$gte = dueAfter;
  if (dueBefore) filter.createdAt.$lte = dueBefore;
}

  if (dueBefore) {
    filter.dueDate = { ...filter.dueDate, $lte: dueBefore };
  }

  if (dueAfter) {
    filter.dueDate = { ...filter.dueDate, $gte: dueAfter };
  }

  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [assignments, total] = await Promise.all([
    AssignmentModel.find(filter)
      .populate("courseId", "title code")
      .populate("createdBy", "username email fullname")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    AssignmentModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    assignments,
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

export const getAssignmentById = async (
  assignmentId: string,
  userId?: mongoose.Types.ObjectId,
  userRole?: Role
) => {
  const assignment = await AssignmentModel.findById(assignmentId)
    .populate("courseId", "title code")
    .populate("createdBy", "username email fullname")
    .lean();

  appAssert(assignment, NOT_FOUND, "Assignment not found");

  const courseIdValue =
    (assignment as any).courseId?._id || (assignment as any).courseId;

  //nếu là học sinh,ktra enrollment status
  if (userRole === Role.STUDENT && userId) {
    const enrollment = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: courseIdValue,
      status: EnrollmentStatus.APPROVED,
    });
    appAssert(
      enrollment,
      FORBIDDEN,
      "You are not approved to access this course"
    );
  }

  await ensureTeacherAccessToCourse({
    courseId: courseIdValue,
    userId,
    userRole,
  });

  return assignment;
};

export const createAssignment = async (
  data: any,
  userId?: mongoose.Types.ObjectId,
  userRole?: Role
) => {
  // Verify course exists
  const course = await CourseModel.findById(data.courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  await ensureTeacherAccessToCourse({ course, userId, userRole });

  const createdBy = userId && (userId as any)._bsontype === 'ObjectID' ? userId : new mongoose.Types.ObjectId(userId as any);
  const assignmentData = { ...data, createdBy };
  const assignment = await AssignmentModel.create(assignmentData);
  const populatedAssignment = await AssignmentModel.findById(assignment._id)
    .populate("courseId", "title code")
    .populate("createdBy", "username email fullname")
    .lean();

  const shouldAnnounce =
    (!!userRole && [Role.TEACHER, Role.ADMIN].includes(userRole)) &&
    !!data.courseId;

  if (shouldAnnounce && userRole) {
    const assignmentTitle =
      populatedAssignment?.title || data.title || "New assignment";
    const courseTitle = (course as any)?.title;
    const courseName = courseTitle ? ` for ${courseTitle}` : "";

    try {
      //tạo announcement cho course
      await AnnouncementModel.create({
        title: `New assignment: ${assignmentTitle}`,
        content: `A new assignment has been posted${courseName}. Please review the details and get started.`,
        courseId: data.courseId,
        authorId: createdBy as mongoose.Types.ObjectId,
      });
    } catch (error) {
      console.error("Failed to create assignment announcement", error);
    }
  }

  return populatedAssignment;
};

export const updateAssignment = async (
  assignmentId: string,
  data: any,
  userId?: mongoose.Types.ObjectId,
  userRole?: Role
) => {
  if (userRole === Role.TEACHER && userId) {
    const assignment = await AssignmentModel.findById(assignmentId).select(
      "courseId"
    );
    appAssert(assignment, NOT_FOUND, "Assignment not found");

    await ensureTeacherAccessToCourse({
      courseId: assignment.courseId as mongoose.Types.ObjectId,
      userId,
      userRole,
    });
  }

  const assignment = await AssignmentModel.findByIdAndUpdate(
    assignmentId,
    data,
    { new: true }
  )
    .populate("courseId", "title code")
    .populate("createdBy", "username email fullname")
    .lean();

  appAssert(assignment, NOT_FOUND, "Assignment not found");
  return assignment;
};

export const deleteAssignment = async (
  assignmentId: string,
  userId?: mongoose.Types.ObjectId,
  userRole?: Role
) => {
  if (userRole === Role.TEACHER && userId) {
    const assignment = await AssignmentModel.findById(assignmentId).select(
      "courseId"
    );
    appAssert(assignment, NOT_FOUND, "Assignment not found");

    await ensureTeacherAccessToCourse({
      courseId: assignment.courseId as mongoose.Types.ObjectId,
      userId,
      userRole,
    });
  }

  const assignment = await AssignmentModel.findByIdAndDelete(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");
  return assignment;
};
