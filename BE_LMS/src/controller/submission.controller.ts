import { catchErrors } from "../utils/asyncHandler";
import { OK, BAD_REQUEST } from "../constants/http";
import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionStatus,
  getSubmissionById,
  listSubmissionsByAssignment,
  gradeSubmission,
  gradeSubmissionById,
  listAllGradesByStudent,
  getSubmissionStats,
  getSubmissionReportByAssignment,
  getSubmissionReportByCourse,
} from "../services/submission.service";
import { submissionBodySchema, assignmentIdParamSchema, submissionIdParamSchema, gradeSubmissionSchema } from "../validators/submission.schemas"; // Validate đầu vào
import appAssert from "../utils/appAssert";
import { SubmissionReportQuery } from "../types/submission.type";
 

// Nộp bài (Submit)
export const submitAssignmentHandler = catchErrors(async (req, res) => {
  const file = req.file;
  const studentId = req.userId;
  const input = submissionBodySchema.parse({
    ...req.body,
    file,
    studentId,
  });

  const submission = await submitAssignment(input);

  return res.success(OK, {
    data: submission,
    message: "Assignment submitted successfully",
  });
});

// Nộp lại (Resubmit)
export const resubmitAssignmentHandler = catchErrors(async (req, res) => {
  const file = req.file;
  const studentId = req.userId;
  const input = submissionBodySchema.parse({
    ...req.body,
    file,
    studentId,
  });

  const submission = await resubmitAssignment(input);

  return res.success(OK, {
    data: submission,
    message: "Assignment resubmitted successfully",
  });
});

// Xem trạng thái bài nộp
export const getSubmissionStatusHandler = catchErrors(async (req, res) => {
  const studentId = req.userId;
  appAssert(studentId, BAD_REQUEST, "Missing user ID");

  const { assignmentId } = assignmentIdParamSchema.parse(req.params);
  const status = await getSubmissionStatus(studentId, assignmentId);

  return res.success(OK, {
    data: status,
    message: "Submission status retrieved successfully",
  });
});

//get sub by Id, load file
export const getSubmissionByIdHandler = catchErrors(async (req, res) => {
  const requesterId = req.userId;
  appAssert(requesterId, BAD_REQUEST, "Missing user ID");

  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const submission = await getSubmissionById(submissionId, requesterId, req.role);

  return res.success(OK, {
    data: submission,
    message: "Submission retrieved successfully",
  });
});

// Danh sách bài nộp theo assignment (cho giảng viên)
export const listSubmissionsByAssignmentHandler = catchErrors(
  async (req, res) => {
    const { assignmentId } = assignmentIdParamSchema.parse(req.params);
    const submissions = await listSubmissionsByAssignment(assignmentId);

    return res.success(OK, {
      data: submissions,
      message: "Submissions retrieved successfully",
    });
  }
);

// Chấm điểm bài nộp (Teacher/Admin)
export const gradeSubmissionHandler = catchErrors(async (req, res) => {
  const graderId = req.userId;
  appAssert(graderId, BAD_REQUEST, "Missing user ID");

  const { assignmentId } = assignmentIdParamSchema.parse(req.params);
  const { studentId, grade, feedback } = gradeSubmissionSchema.parse(req.body);

  const result = await gradeSubmission(
    assignmentId,
    studentId,
    graderId,
    grade,
    feedback,
    req.role
  );

  return res.success(OK, {
    data: result,
    message: "Submission graded successfully",
  });
});

//grade submussionid
export const gradeSubmissionByIdHandler = catchErrors(async (req, res) => {
  const graderId = req.userId;
  appAssert(graderId, BAD_REQUEST, 'Missing user ID');

  const { submissionId } = req.params as { submissionId?: string };
  appAssert(submissionId && submissionId.length === 24, BAD_REQUEST, 'Missing or invalid submission ID');

  const { grade, feedback } = req.body as { grade?: number; feedback?: string };
  appAssert(typeof grade === 'number', BAD_REQUEST, 'Missing grade');

  const result = await gradeSubmissionById(
    submissionId,
    graderId,
    grade,
    feedback,
    req.role
  );

  return res.success(OK, {
    data: result,
    message: 'Submission graded successfully',
  });
});


export const listAllGradesByStudentHandler = catchErrors(async (req, res) => {
  const studentId = req.userId;
  appAssert(studentId, BAD_REQUEST, "Missing user ID");

  const result = await listAllGradesByStudent(studentId);

  return res.success(OK, {
    data: result,
    message: "All grades retrieved successfully",
  });
});

//static and report
export const getSubmissionStatsHandler = catchErrors(async (req, res) => {
  const { assignmentId } = req.params;
  appAssert(assignmentId, BAD_REQUEST, "Missing assignment ID");

  const stats = await getSubmissionStats(assignmentId);
  return res.success(OK, {
    data: stats,
    message: "Submission statistics retrieved successfully",
  });
});
//submission report for a single assignment
export const getSubmissionReportHandler = catchErrors(async (req, res) => {
  const { assignmentId } = req.params;
  const query: SubmissionReportQuery = req.query;
  appAssert(assignmentId, BAD_REQUEST, "Missing assignment ID");

  const report = await getSubmissionReportByAssignment(assignmentId, query);
  return res.success(OK, {
    data: report,
    message: "Submission report retrieved successfully",
  });
});

//report toan bo course
export const getCourseReportHandler = catchErrors(async (req, res) => {
  const { courseId } = req.params;
  appAssert(courseId, BAD_REQUEST, "Missing course ID");

  const report = await getSubmissionReportByCourse(courseId);
  return res.success(OK, {
    data: report,
    message: "Course report retrieved successfully",
  });
});