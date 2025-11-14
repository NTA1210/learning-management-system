import { catchErrors } from "../utils/asyncHandler";
import { BAD_REQUEST, OK } from "../constants/http";
import { Role } from "../types";
import { addTimeForLesson, completeLesson, getCourseProgress, getLessonProgress } from "@/services/lessonProgress.service";
import {
  GetLessonProgressSchema,
  AddTimeForLessonBodySchema,
  LessonIdParamSchema,
  GetCourseProgressSchema,
} from "../validators/lessonProgress.schemas";
import appAssert from "@/utils/appAssert";

// GET /lesson-progress/lesson/:lessonId - Lấy tiến độ 1 bài học
export const getLessonProgressController = catchErrors(async (req, res) => {
  const validated = GetLessonProgressSchema.parse({
    lessonId: req.params.lessonId,
    studentId: req.query.studentId,
  });
  
  const requesterId = req.userId?.toString();
  const requesterRole = req.role as Role;

  const result = await getLessonProgress(validated.lessonId, requesterId, requesterRole, validated.studentId);
  return res.success(OK, { 
    data: result, 
    message: "Get lesson progress successfully" 
  });
});

// PATCH /lesson-progress/lesson/:lessonId/time - Cộng dồn thời gian học cho 1 bài
export const addTimeForLessonController = catchErrors(async (req, res) => {
  const validatedParams = LessonIdParamSchema.parse({ lessonId: req.params.lessonId });
  
  // Check if body exists and has incSeconds
  if (!req.body || req.body.incSeconds === undefined) {
    appAssert(false, BAD_REQUEST, "Request body is required with incSeconds field");
  }
  
  const validatedBody = AddTimeForLessonBodySchema.parse(req.body);
  
  const requesterId = req.userId?.toString();
  const requesterRole = req.role as Role;

  const result = await addTimeForLesson(validatedParams.lessonId, validatedBody.incSeconds, requesterId, requesterRole);
  return res.success(OK, { 
    data: result, 
    message: "Add time for lesson successfully" 
  });
});

// PATCH /lesson-progress/lesson/:lessonId/complete - Đánh dấu hoàn thành bài học
export const completeLessonController = catchErrors(async (req, res) => {
  const validatedParams = LessonIdParamSchema.parse({ lessonId: req.params.lessonId });
  
  const requesterId = req.userId?.toString();
  const requesterRole = req.role as Role;

  const result = await completeLesson(validatedParams.lessonId, requesterId, requesterRole);
  return res.success(OK, { 
    data: result, 
    message: "Complete lesson successfully" 
  });
});

// GET /lesson-progress/course/:courseId - Lấy tiến độ toàn khóa (có thể truyền studentId cho teacher/admin)
export const getCourseProgressController = catchErrors(async (req, res) => {
  const validated = GetCourseProgressSchema.parse({
    courseId: req.params.courseId,
    studentId: req.query.studentId,
    from: req.query.from,
    to: req.query.to,
  });
  
  const requesterId = req.userId?.toString();
  const requesterRole = req.role as Role;

  const result = await getCourseProgress(
    validated.courseId,
    requesterId,
    requesterRole,
    validated.studentId,
    { from: validated.from, to: validated.to }
  );
  return res.success(OK, { 
    data: result, 
    message: "Get course progress successfully" 
  });
});



