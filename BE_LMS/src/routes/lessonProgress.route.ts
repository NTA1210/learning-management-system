import { Router } from "express";

import {
  getLessonProgressController,
  addTimeForLessonController,
  completeLessonController,
  getCourseProgressController,
} from "../controller/lessonProgress.controller";

import authenticate from "@/middleware/authenticate";

const lessonProgressRoutes = Router();

//prefix : /lesson-progress

// GET /lesson-progress/lesson/:lessonId - Lấy tiến độ 1 bài học (auth required)
// Query params: ?studentId (optional, for teacher/admin to view specific student)
lessonProgressRoutes.get("/lesson/:lessonId", authenticate, getLessonProgressController);

// PATCH /lesson-progress/lesson/:lessonId/time - Cộng dồn thời gian học cho 1 bài (auth required)
// Body: { incSeconds: number }
lessonProgressRoutes.patch("/lesson/:lessonId/time", authenticate, addTimeForLessonController);

// PATCH /lesson-progress/lesson/:lessonId/complete - Đánh dấu hoàn thành bài học (auth required)
lessonProgressRoutes.patch("/lesson/:lessonId/complete", authenticate, completeLessonController);

// GET /lesson-progress/course/:courseId - Lấy tiến độ toàn khóa (auth required)
// Query params: ?studentId (optional, for teacher/admin to view specific student)
lessonProgressRoutes.get("/course/:courseId", authenticate, getCourseProgressController);

export default lessonProgressRoutes;








