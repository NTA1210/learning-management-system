import SubmissionModel from "../models/submission.model";
import AssignmentModel from "../models/assignment.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, BAD_REQUEST } from "../constants/http";

//submit assign
export const submitAssignment = async (
  studentId: string,
  assignmentId: string,
  fileUrl: string,
  fileName?: string
) => {
  //ktra ass có tồn tại ko
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  //ktra nộp chưa
  const existing = await SubmissionModel.findOne({ assignmentId, studentId });
  if (existing) {
  appAssert(
    assignment.allowLate,
    BAD_REQUEST,
    "You already submitted and resubmission is not allowed"
  );
}


  //ktra nộp trễ
  const submittedAt = new Date();
  const isLate = assignment.dueDate && submittedAt > assignment.dueDate;

  const submission = await SubmissionModel.create({
    assignmentId,
    studentId,
    fileUrl,
    fileName,
    submittedAt,
    // isLate,
    // status: isLate ? "overdue" : "submitted",
  });

  return await submission.populate("assignmentID","title dueDate");
};

 //sửa bt resubmit
 // Chỉ cho phép nếu assignment.allowLate === true
export const resubmitAssignment = async (
  studentId: string,
  assignmentId: string,
  fileUrl: string,
  fileName?: string
) => {
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  //ktra quyền nộp lại
  appAssert(assignment.allowLate, BAD_REQUEST, "Resubmission is not allowed");

  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  const resubmittedAt = new Date();
  //const isLate = assignment.dueDate && resubmittedAt > assignment.dueDate;

  submission.fileUrl = fileUrl;
  submission.fileName = fileName;
  submission.submittedAt = resubmittedAt;
  //submission.isLate = isLate;
  //submission.status = isLate ? "overdue" : "submitted";

  await submission.save();
  return await submission.populate("assignmentID","title dueDate");
};

 //xem status bài nộp
export const getSubmissionStatus = async (
  studentId: string,
  assignmentId: string
) => {
  const submission = await SubmissionModel.findOne({ assignmentId, studentId })
    .populate("assignmentId", "title dueDate allowLate")
    .populate("gradedBy", "fullname email");

  if (!submission) {
    return {
      status: "not_submitted",
      message: "No submission found",
    };
  }

  return {
    status: submission.status,
    isLate: submission.isLate,
    grade: submission.grade,
    feedback: submission.feedback,
    submittedAt: submission.submittedAt,
  };
};
//hàm bổ sung, ds bài nộp theo assignment cho GV
export const listSubmissionsByAssignment = async (assignmentId: string) => {
  return SubmissionModel.find({ assignmentId })
    .populate("studentId", "fullname email")
    .sort({ submittedAt: -1 });
};