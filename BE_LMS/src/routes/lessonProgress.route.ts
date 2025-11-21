import { Router } from "express";
import {
  getLessonProgressController,
  addTimeForLessonController,
  completeLessonController,
  getCourseProgressController,
} from "../controller/lessonProgress.controller";
import authenticate from "@/middleware/authenticate";

const lessonProgressRoutes = Router();

// prefix: /lesson-progress

// Protected routes (require authentication)
// GET /lesson-progress/lesson/:lessonId - Lấy tiến độ 1 bài học
// Query params: ?studentId (optional, for teacher/admin to view specific student)
lessonProgressRoutes.get("/lessons/:lessonId", authenticate, getLessonProgressController);
// GET /lesson-progress/course/:courseId - Lấy tiến độ toàn khóa
// Query params: ?studentId (optional, for teacher/admin to view specific student)
lessonProgressRoutes.get("/courses/:courseId", authenticate, getCourseProgressController);

// PATCH /lesson-progress/lesson/:lessonId/time - Cộng dồn thời gian học cho 1 bài
// Body: { incSeconds: number }
lessonProgressRoutes.patch("/lessons/:lessonId/time", authenticate, addTimeForLessonController);
// PATCH /lesson-progress/lesson/:lessonId/complete - Đánh dấu hoàn thành bài học
lessonProgressRoutes.patch("/lessons/:lessonId/complete", authenticate, completeLessonController);

export default lessonProgressRoutes;









