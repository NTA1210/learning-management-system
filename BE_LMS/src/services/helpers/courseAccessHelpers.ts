import mongoose from "mongoose";
import CourseModel from "../../models/course.model";
import appAssert from "../../utils/appAssert";
import { NOT_FOUND, FORBIDDEN } from "../../constants/http";
import { Role } from "../../types";

export const normalizeObjectId = (
  id?: mongoose.Types.ObjectId | string | null
) => {
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
};

type EnsureTeacherAccessParams = {
  course?: any;
  courseId?: mongoose.Types.ObjectId | string | null;
  userId?: mongoose.Types.ObjectId | null;
  userRole?: Role | null;
};

export const ensureTeacherAccessToCourse = async ({
  course,
  courseId,
  userId,
  userRole,
}: EnsureTeacherAccessParams) => {
  const courseDoc =
    course ??
    (courseId ? await CourseModel.findById(courseId).select("teacherIds title").lean() : null);

  if (!userId || userRole !== Role.TEACHER) {
    return courseDoc;
  }

  appAssert(courseDoc, NOT_FOUND, "Course not found");

  const teacherIdStr = normalizeObjectId(userId);
  const teacherIds = courseDoc.teacherIds || [];
  const isTeacherInCourse = teacherIds.some(
    (teacherId: mongoose.Types.ObjectId) => teacherId.toString() === teacherIdStr
  );

  appAssert(
    isTeacherInCourse,
    FORBIDDEN,
    "You are not assigned to teach this course"
  );

  return courseDoc;
};

