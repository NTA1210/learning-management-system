import mongoose from "mongoose";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import LessonProgressModel from "../models/lessonProgress.model";
import EnrollmentModel from "../models/enrollment.model";
import appAssert from "../utils/appAssert";
import { FORBIDDEN, NOT_FOUND, BAD_REQUEST, TOO_MANY_REQUESTS } from "../constants/http";
import { Role } from "../types";
import { EnrollmentStatus } from "../types/enrollment.type";

function calcProgressPercent(durationMinutes?: number | null, timeSpentSeconds?: number | null) {
  if (!durationMinutes || durationMinutes <= 0 || !timeSpentSeconds || timeSpentSeconds <= 0) return 0;
  const totalSeconds = durationMinutes * 60;
  const percent = Math.floor((timeSpentSeconds / totalSeconds) * 100);
  return Math.min(100, Math.max(0, percent));
}

/**
 * Yêu cầu nghiệp vụ: Lấy tiến độ 1 bài học cho một user.
 * - Nếu là STUDENT: chỉ xem của chính mình.
 * - TEACHER: chỉ xem của học viên trong các khóa mình dạy.
 * - ADMIN: xem tất cả.
 * - Nếu chưa có bản ghi, sẽ tạo mới ở lần ghi; với GET thì trả 404 nếu chưa có khi query người khác.
 */
export const getLessonProgress = async (
  lessonId: string,
  requesterId: mongoose.Types.ObjectId,
  requesterRole: Role,
  studentId?: string
) => {
  appAssert(mongoose.Types.ObjectId.isValid(lessonId), NOT_FOUND, "Invalid lesson ID");

  const lesson = await LessonModel.findById(lessonId).populate("courseId", "teacherIds isPublished").lean();
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Determine target student
  const targetStudentId = studentId || requesterId;

  // Authorization
  if (requesterRole === Role.STUDENT) {
    appAssert(targetStudentId === requesterId, FORBIDDEN, "Cannot view other student's progress");
  } else if (requesterRole === Role.TEACHER) {
    const course = lesson.courseId as any;
    const isInstructor = course.teacherIds?.some((id: mongoose.Types.ObjectId) => id.equals(requesterId));
    appAssert(isInstructor, FORBIDDEN, "Not authorized to view progress for this lesson");
  }

  const progress = await LessonProgressModel.findOne({
    lessonId: new mongoose.Types.ObjectId(lessonId),
    studentId: new mongoose.Types.ObjectId(targetStudentId),
  }).lean();

  if (!progress) {
    appAssert(false, NOT_FOUND, "Progress not found");
  }

  const progressPercent = calcProgressPercent((lesson as any).durationMinutes, progress?.timeSpentSeconds || 0);

  return { ...progress, progressPercent };
};

/**
 * Yêu cầu nghiệp vụ: Cộng dồn thời gian học cho một bài.
 * - Nếu chưa có progress thì tạo mới.
 * - Chặn giá trị bất thường: incSeconds ∈ [1, 300].
 * - STUDENT: chỉ cập nhật của chính mình; TEACHER không cập nhật thay; ADMIN được phép.
 * - Auto-complete khi đạt 100% (nếu lesson có durationMinutes hợp lệ).
 */
export const addTimeForLesson = async (
  lessonId: string,
  incSeconds: number,
  requesterId: mongoose.Types.ObjectId,
  requesterRole: Role
) => {
  appAssert(mongoose.Types.ObjectId.isValid(lessonId), NOT_FOUND, "Invalid lesson ID");
  appAssert(Number.isFinite(incSeconds) && incSeconds >= 1 && incSeconds <= 300, BAD_REQUEST, "Invalid time increment");

  const lesson = await LessonModel.findById(lessonId).populate("courseId", "teacherIds").lean();
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Only student self or admin can update time
  if (requesterRole === Role.TEACHER) {
    appAssert(false, FORBIDDEN, "Teacher cannot update student's time");
  }

  // Ensure enrollment for student
  if (requesterRole === Role.STUDENT) { 
    const enrolled = await EnrollmentModel.exists({
      studentId: requesterId,
      courseId: (lesson.courseId as any)._id,
      status: EnrollmentStatus.APPROVED
    });
    appAssert(enrolled, FORBIDDEN, "Not enrolled in this course");
  }

  const now = new Date();
  
  // Check existing progress to validate rate limiting (60 seconds)
  // Sử dụng lastAccessedAt để kiểm tra, nhưng chỉ áp dụng nếu đã có timeSpentSeconds > 0
  // (để tránh chặn request đầu tiên hoặc sau khi completeLesson)
  const existingProgress = await LessonProgressModel.findOne({
    lessonId: new mongoose.Types.ObjectId(lessonId),
    courseId: (lesson.courseId as any)._id,
    studentId: new mongoose.Types.ObjectId(requesterId)
  }).lean();

  // Chỉ kiểm tra rate limiting nếu đã có thời gian học (tức là đã từng gọi addTimeForLesson)
  if (existingProgress?.lastAccessedAt && existingProgress?.timeSpentSeconds && existingProgress.timeSpentSeconds > 0) {
    const timeSinceLastUpdate = (now.getTime() - existingProgress.lastAccessedAt.getTime()) / 1000; // seconds
    const minIntervalSeconds = 60;
    appAssert(
      timeSinceLastUpdate >= minIntervalSeconds,
      TOO_MANY_REQUESTS,
      `Please wait ${Math.ceil(minIntervalSeconds - timeSinceLastUpdate)} seconds before sending another request`
    );
  }

  const progress = await LessonProgressModel.findOneAndUpdate(
    { lessonId: new mongoose.Types.ObjectId(lessonId), courseId: (lesson.courseId as any)._id, studentId: new mongoose.Types.ObjectId(requesterId) },
    { $setOnInsert: { isCompleted: false }, $inc: { timeSpentSeconds: incSeconds }, $set: { lastAccessedAt: now } },
    { new: true, upsert: true }
  );

  const progressPercent = calcProgressPercent((lesson as any).durationMinutes, progress?.timeSpentSeconds || 0);
  if (progress && !progress.isCompleted && progressPercent >= 100) {
    progress.isCompleted = true;
    (progress as any).completedAt = now;
    await progress.save();
  }

  return { ...(progress.toObject()), progressPercent };
};

/**
 * Yêu cầu nghiệp vụ: Đánh dấu hoàn thành bài học.
 * - STUDENT: chỉ đánh dấu của chính mình; TEACHER không đánh dấu thay; ADMIN được phép.
 * - Idempotent: gọi nhiều lần không lỗi.
 */
export const completeLesson = async (
  lessonId: string,
  requesterId: mongoose.Types.ObjectId,
  requesterRole: Role
) => {
  appAssert(mongoose.Types.ObjectId.isValid(lessonId), NOT_FOUND, "Invalid lesson ID");

  const lesson = await LessonModel.findById(lessonId).populate("courseId", "teacherIds").lean();
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  if (requesterRole === Role.TEACHER) {
    appAssert(false, FORBIDDEN, "Teacher cannot complete for student");
  }

  if (requesterRole === Role.STUDENT) {
    const enrolled = await EnrollmentModel.exists({
      studentId: requesterId,
      courseId: (lesson.courseId as any)._id,
      status: EnrollmentStatus.APPROVED
    });
    appAssert(enrolled, FORBIDDEN, "Not enrolled in this course");
  }

  const now = new Date();
  const updated = await LessonProgressModel.findOneAndUpdate(
    { lessonId: new mongoose.Types.ObjectId(lessonId), courseId: (lesson.courseId as any)._id, studentId: new mongoose.Types.ObjectId(requesterId) },
    { $set: { isCompleted: true, completedAt: now, lastAccessedAt: now } },
    { new: true, upsert: true }
  ).lean();

  const progressPercent = calcProgressPercent((lesson as any).durationMinutes, updated?.timeSpentSeconds || 0);
  return { ...updated, progressPercent };
};

/**
 * Yêu cầu nghiệp vụ: Tiến độ theo khóa học cho 1 học viên.
 * - STUDENT: chỉ xem của mình.
 * - TEACHER: chỉ xem học viên thuộc khóa mình dạy.
 * - ADMIN: xem tất cả.
 * - Tính completionRate dựa trên số lesson đã publish trong course.
 */
export const getCourseProgress = async (
  courseId: string,
  requesterId: mongoose.Types.ObjectId,
  requesterRole: Role,
  studentId?: string,
  options?: { from?: Date; to?: Date }
) => {
  const { from, to } = options || {};
  appAssert(mongoose.Types.ObjectId.isValid(courseId), NOT_FOUND, "Invalid course ID");

  const course = await CourseModel.findById(courseId).lean();
  appAssert(course, NOT_FOUND, "Course not found");

  const targetStudentId = studentId || requesterId;

  if (requesterRole === Role.STUDENT) {
    appAssert(targetStudentId === requesterId, FORBIDDEN, "Cannot view other student's course progress");
  } else if (requesterRole === Role.TEACHER) {
    const isInstructor = (course as any).teacherIds?.some((id: mongoose.Types.ObjectId) => id.equals(requesterId));
    appAssert(isInstructor, FORBIDDEN, "Not authorized to view this course progress");
  }

  const lessonFilter: any = { courseId, publishedAt: { $ne: null } };
  if (from || to) {
    lessonFilter.createdAt = {};
    if (from) lessonFilter.createdAt.$gte = from;
    if (to) lessonFilter.createdAt.$lte = to;
  }

  const lessons = await LessonModel.find(lessonFilter).sort({ order: 1 }).lean();
  const lessonIds = lessons.map(l => l._id);

  const progressFilter: any = {
    courseId,
    studentId: targetStudentId,
    lessonId: { $in: lessonIds },
  };

  if (from || to) {
    progressFilter.createdAt = {};
    if (from) progressFilter.createdAt.$gte = from;
    if (to) progressFilter.createdAt.$lte = to;
  }

  const progresses = await LessonProgressModel.find(progressFilter).lean();
  const progressMap = new Map(progresses.map(p => [p.lessonId.toString(), p]));

  const items = lessons.map(l => {
    const p = progressMap.get(l._id.toString());
    const percent = calcProgressPercent((l as any).durationMinutes, p?.timeSpentSeconds || 0);
    return {
      lessonId: l._id,
      title: l.title,
      order: l.order,
      isCompleted: !!p?.isCompleted,
      progressPercent: percent,
      lastAccessedAt: p?.lastAccessedAt || null,
    };
  });

  const totalLessons = lessons.length || 1;
  const completedCount = items.filter(i => i.isCompleted).length;
  const completionRate = Math.round((completedCount / totalLessons) * 100);

  const nextLesson = items.find(i => !i.isCompleted);

  return {
    courseId,
    studentId: targetStudentId,
    completionRate,
    totalLessons: lessons.length,
    completedLessons: completedCount,
    nextLessonSuggestion: nextLesson ? { lessonId: nextLesson.lessonId, title: nextLesson.title, order: nextLesson.order } : null,
    lessons: items,
  };
};











