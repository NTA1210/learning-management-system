import { Router } from "express";
import {
    submitAssignmentHandler,
    resubmitAssignmentHandler,
    getSubmissionStatusHandler,
    listSubmissionsByAssignmentHandler,
    gradeSubmissionHandler,
}from "../controller/submission.controller";
import  authenticate  from "../middleware/authenticate";
import { Role } from "@/types";
import authorize from "@/middleware/authorize";
import sessionRoutes from "./session.route";
import upload from "@/config/multer";



const submissionRoutes = Router();

// prefix: /submissions

//sv nộp bài
submissionRoutes.post("/", authenticate,upload.single("file"),submitAssignmentHandler);

//sv nộp lại bài (khi được phép)
submissionRoutes.put("/:assignmentId/resubmit", authenticate, resubmitAssignmentHandler);

//sv xem trạng thái nộp bài
submissionRoutes.get("/:assignmentId/status", authenticate, getSubmissionStatusHandler);

//GV xem danh sách bài nộp của 1 assignment
submissionRoutes.get("/:assignmentId/all", authenticate,authorize(Role.ADMIN,Role.TEACHER), listSubmissionsByAssignmentHandler);

//GV chấm điểm bài nộp
submissionRoutes.put("/:assignmentId/grade", authenticate , authorize(Role.ADMIN, Role.TEACHER),gradeSubmissionHandler);

export default submissionRoutes;