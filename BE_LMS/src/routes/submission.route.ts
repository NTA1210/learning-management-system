import { Router } from "express";
import {
    submitAssignmentHandler,
    resubmitAssignmentHandler,
    getSubmissionStatusHandler,
    listSubmissionsByAssignmentHandler,
}from "../controller/submission.controller";
import  authenticate  from "../middleware/authenticate";

const submissionRoutes = Router();

// prefix: /submissions

//sv nộp bài
submissionRoutes.post("/:assignmentId", authenticate, submitAssignmentHandler);

//sv nộp lại bài (khi được phép)
submissionRoutes.put("/:assignmentId/resubmit", authenticate, resubmitAssignmentHandler);

//sv xem trạng thái nộp bài
submissionRoutes.get("/:assignmentId/status", authenticate, getSubmissionStatusHandler);

//GV xem danh sách bài nộp của 1 assignment
submissionRoutes.get("/:assignmentId/all", authenticate, listSubmissionsByAssignmentHandler);

export default submissionRoutes;
