import { Router } from "express";
import {
    submitAssignmentHandler,
    resubmitAssignmentHandler,
    getSubmissionStatusHandler,
    listSubmissionsByAssignmentHandler,
    gradeSubmissionHandler,
    listAllGradesByStudentHandler,
    getSubmissionStatsHandler,
    getSubmissionReportHandler,
    getCourseReportHandler,
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
submissionRoutes.put("/", authenticate, upload.single("file"),resubmitAssignmentHandler);

//sv xem trạng thái nộp bài
submissionRoutes.get("/:assignmentId/status", authenticate, getSubmissionStatusHandler);

//GV xem danh sách bài nộp của 1 assignment
submissionRoutes.get("/:assignmentId/all", authenticate,authorize(Role.ADMIN,Role.TEACHER), listSubmissionsByAssignmentHandler);

//GV chấm điểm bài nộp
submissionRoutes.put("/:assignmentId/grade", authenticate , authorize(Role.ADMIN, Role.TEACHER),gradeSubmissionHandler);
//sv xem toàn bộ điểm
submissionRoutes.get("/my/grades", authenticate,listAllGradesByStudentHandler );
export default submissionRoutes;
//thống kê và báo cáo
submissionRoutes.get("/:assignmentId/stats", authenticate, authorize(Role.ADMIN, Role.TEACHER), getSubmissionStatsHandler);
submissionRoutes.get("/report/assignment", authenticate, authorize(Role.ADMIN, Role.TEACHER), getSubmissionReportHandler);
submissionRoutes.get("/course/:courseId/report", authenticate, authorize(Role.ADMIN, Role.TEACHER), getCourseReportHandler);