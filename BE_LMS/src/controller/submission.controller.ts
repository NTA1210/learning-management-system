import { catchErrors } from "../utils/asyncHandler";
import { CREATED, OK, BAD_REQUEST } from "../constants/http";
import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionStatus,
  listSubmissionsByAssignment,
  gradeSubmission,
} from "../services/submission.service";
import {
  submissionParamsSchema,
  submissionBodySchema,
} from "../validators/submission.schemas"; // 🆕 Validate đầu vào
import appAssert from "../utils/appAssert";
import { Role } from "../types";
import authorize from "@/middleware/authorize";
import { gradeSubmissionSchema } from "../validators/submission.schemas";

// 🟢 1. Nộp bài (Submit)
export const submitAssignmentHandler = catchErrors(async (req, res) => {
  // ✅ Sử dụng req.userId (theo global typing)
  const studentId = req.userId?.toString();
  appAssert(studentId, BAD_REQUEST, "Missing user ID");

  // ✅ Validate params và body
  const { assignmentId } = submissionParamsSchema.parse(req.params);
  const { key, originalName, mimeType, size } = submissionBodySchema.parse(req.body);

  const submission = await submitAssignment(studentId, assignmentId, key, originalName, mimeType, size);

  // return res.status(CREATED).json({
  //   message: "Assignment submitted successfully",
  //   data: submission,
  // });
  // return res.success(OK, submission, "Assignment submitted successfully")
  return res.success(OK, {data: submission, message: "Assignment submitted successfully"})
});

// 🟡 2. Nộp lại (Resubmit)
export const resubmitAssignmentHandler = catchErrors(async (req, res) => {
  const studentId = req.userId?.toString();
  appAssert(studentId, BAD_REQUEST, "Missing user ID");

  const { assignmentId } = submissionParamsSchema.parse(req.params);
  const { key, originalName, mimeType, size } = submissionBodySchema.parse(req.body);

  const submission = await resubmitAssignment(studentId, assignmentId, key, originalName, mimeType, size);

  // return res.status(OK).json({
  //   message: "Assignment resubmitted successfully",
  //   data: submission,
  // });
  return res.success(OK, {data: submission, message: "Assignment resubmitted successfully"});
});

// 🔵 3. Xem trạng thái bài nộp
export const getSubmissionStatusHandler = catchErrors(async (req, res) => {
  const studentId = req.userId?.toString();
  appAssert(studentId, BAD_REQUEST, "Missing user ID");

  const { assignmentId } = submissionParamsSchema.parse(req.params);
  const status = await getSubmissionStatus(studentId, assignmentId);

  // return res.status(OK).json({
  //   message: "Submission status retrieved successfully",
  //   data: status,
  // });
  return res.success(OK, {data: status,message: "Submission status retrieved successfully"});
});

// 🧩 4. Danh sách bài nộp theo assignment (cho giảng viên)
export const listSubmissionsByAssignmentHandler = catchErrors(async (req, res) => {
  const { assignmentId } = submissionParamsSchema.parse(req.params);
  const submissions = await listSubmissionsByAssignment(assignmentId);

  // return res.status(OK).json({
  //   message: "Submissions retrieved successfully",
  //   data: submissions,
  // });
  return res.success(OK,{ data:submissions, message: "Submissions retrieved successfully"});
});

// 🟥 5. Chấm điểm bài nộp (Teacher/Admin)
export const gradeSubmissionHandler = catchErrors(async (req, res) => {
  const graderId = req.userId?.toString();
  appAssert(graderId, BAD_REQUEST, "Missing user ID");

  const { assignmentId } = submissionParamsSchema.parse(req.params);
  const { studentId, grade, feedback } = gradeSubmissionSchema.parse(req.body);

  const result = await gradeSubmission(
    assignmentId,
    studentId,
    graderId,
    grade,
    feedback
  );

  return res.success(OK, {data: result,message: "Submission graded successfully"});
});
