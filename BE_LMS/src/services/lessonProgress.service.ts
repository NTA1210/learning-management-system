import mongoose from "mongoose";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import LessonProgressModel from "../models/lessonProgress.model";
import EnrollmentModel from "../models/enrollment.model";
import appAssert from "../utils/appAssert";
import { FORBIDDEN, NOT_FOUND, BAD_REQUEST, TOO_MANY_REQUESTS } from "../constants/http";
import { Role } from "../types";
import { EnrollmentStatus } from "../types/enrollment.type";

// Cấu hình chống cheat
const HEARTBEAT_MIN_INTERVAL = 12; // giây – không cho gửi quá nhanh
const MAX_TIME_MULTIPLIER = 1.3;   // tối đa được cộng 1.3x thời gian thực tế trôi qua
const COMPLETION_THRESHOLD = 0.95; // 95% → đánh dấu hoàn thành (giống Udemy)

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
 * - Auto-complete khi đạt 95% (nếu lesson có durationMinutes hợp lệ).
 */
export const addTimeForLesson = async (
  lessonId: string,
  incSeconds: number,
  requesterId: mongoose.Types.ObjectId,
  requesterRole: Role
) => {
  appAssert(mongoose.Types.ObjectId.isValid(lessonId), NOT_FOUND, "Invalid lesson ID");
  appAssert(
    Number.isInteger(incSeconds) && incSeconds >= 1 && incSeconds <= 300,
    BAD_REQUEST,
    "incSeconds must be integer 1-300"
  );

  const lessonObjId = new mongoose.Types.ObjectId(lessonId);
  const studentObjId = new mongoose.Types.ObjectId(requesterId);

  const lesson = await LessonModel.findById(lessonObjId)
    .populate<{ courseId: { _id: mongoose.Types.ObjectId } }>("courseId")
    .lean();
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  const courseId = (lesson.courseId as any)._id;

  // Phân quyền
  if (requesterRole === Role.STUDENT) {
    const enrolled = await EnrollmentModel.exists({
      studentId: studentObjId,
      courseId,
      status: EnrollmentStatus.APPROVED,
    });
    appAssert(enrolled, FORBIDDEN, "Not enrolled in this course");
  } else if (requesterRole === Role.TEACHER) {
    appAssert(false, FORBIDDEN, "Teacher cannot update student progress");
  }
  // ADMIN → được phép

  const now = new Date();

  // Kiểm tra progress hiện tại
  const existing = await LessonProgressModel.findOne({
    lessonId: lessonObjId,
    courseId,
    studentId: studentObjId,
  }).lean();

  if (existing?.lastAccessedAt) {
    const secondsSinceLast = (now.getTime() - existing.lastAccessedAt.getTime()) / 1000;

    // 1. Rate limit: không cho gửi quá nhanh
    appAssert(
      secondsSinceLast >= HEARTBEAT_MIN_INTERVAL,
      TOO_MANY_REQUESTS,
      `Please wait ${Math.ceil(HEARTBEAT_MIN_INTERVAL - secondsSinceLast)}s`
    );

    // 2. CHỐNG CHEAT: không cho cộng quá 1.3x thời gian thực tế
    const maxAllowed = Math.floor(secondsSinceLast * MAX_TIME_MULTIPLIER);
    if (incSeconds > maxAllowed) {
      appAssert(false, BAD_REQUEST, "Time increment exceeds real elapsed time");
    }
  }

  // Cộng thời gian
  const progress = await LessonProgressModel.findOneAndUpdate(
    { lessonId: lessonObjId, courseId, studentId: studentObjId },
    {
      $setOnInsert: { isCompleted: false },
      $inc: { timeSpentSeconds: incSeconds },
      $set: { lastAccessedAt: now },
    },
    { upsert: true, new: true }
  );

  // Auto complete khi đạt >= 95%
  const percent = calcProgressPercent(lesson.durationMinutes, progress.timeSpentSeconds);
  if (!progress.isCompleted && percent >= COMPLETION_THRESHOLD * 100) {
    progress.isCompleted = true;
    progress.completedAt = now; // hook pre-save sẽ bắt nếu cần
    await progress.save();
  }

  return {
    ...progress.toObject(),
    progressPercent: percent,
  };
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











