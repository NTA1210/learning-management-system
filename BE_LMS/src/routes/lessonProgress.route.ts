import { Router } from "express";
import authenticate from "@/middleware/authenticate";
import { 
  addTimeForLessonController, 
  completeLessonController, 
  getCourseProgressController, 
  getLessonProgressController 
} from "@/controller/lessonProgress.controller";

const lessonProgressRoutes = Router();

// prefix: /lesson-progress

// GET /lesson-progress/lesson/:lessonId - Lấy tiến độ 1 bài học (auth required)
lessonProgressRoutes.get("/lesson/:lessonId", authenticate, getLessonProgressController);

// PATCH /lesson-progress/lesson/:lessonId/time - Cộng dồn thời gian học cho 1 bài (auth required)
lessonProgressRoutes.patch("/lesson/:lessonId/time", authenticate, addTimeForLessonController);

// PATCH /lesson-progress/lesson/:lessonId/complete - Đánh dấu hoàn thành (auth required)
lessonProgressRoutes.patch("/lesson/:lessonId/complete", authenticate, completeLessonController);

// GET /lesson-progress/course/:courseId - Tiến độ toàn khóa (auth required)
lessonProgressRoutes.get("/course/:courseId", authenticate, getCourseProgressController);

export default lessonProgressRoutes;












