import SubmissionModel from "../models/submission.model";
import AssignmentModel from "../models/assignment.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, BAD_REQUEST } from "../constants/http";
import mongoose from "mongoose";
import { SubmissionStatus } from "../types/submission.type";
import { UserModel } from "@/models";
import { Role } from "@/types";
import { uploadFile } from "@/utils/uploadFile";
import { prefixSubmission } from "@/utils/filePrefix";

//submit assign
export const submitAssignment = async (
 {
  studentId,
  assignmentId,
  file
 }:{ studentId: string,
  assignmentId: string,
  file:Express.Multer.File}
) => {
  const student = await UserModel.findOne({id:studentId, role:Role.STUDENT})
  appAssert(student, BAD_REQUEST, "Missing user ID");
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

  const prefix = prefixSubmission(assignment.courseId,assignmentId,studentId);
  const {} = uploadFile(file,prefix);


}


  //ktra nộp trễ
  const submittedAt = new Date();
  const isLate = assignment.dueDate && submittedAt > assignment.dueDate;

  const submission = await SubmissionModel.create({
    assignmentId,
    studentId,
    key,
    originalName,
    mimeType,
    size: size || 0,
    submittedAt,
    status: isLate ? SubmissionStatus.OVERDUE : SubmissionStatus.SUBMITTED,
  });

  return await submission.populate("assignmentId","title dueDate");
};

 //sửa bt resubmit
 // Chỉ cho phép nếu assignment.allowLate === true
export const resubmitAssignment = async (
  studentId: string,
  assignmentId: string,
  key: string,
  originalName: string,
  mimeType?: string,
  size?: number
) => {
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  //ktra quyền nộp lại
  appAssert(assignment.allowLate, BAD_REQUEST, "Resubmission is not allowed");

  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  const resubmittedAt = new Date();
  const isLate = assignment.dueDate && resubmittedAt > assignment.dueDate;

  submission.key = key;
  submission.originalName = originalName;
  if (mimeType) submission.mimeType = mimeType;
  if (size !== undefined) submission.size = size;
  submission.submittedAt = resubmittedAt;
  submission.status = isLate ? SubmissionStatus.OVERDUE : SubmissionStatus.RESUBMITTED;

  await submission.save();
  return await submission.populate("assignmentId","title dueDate");
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

//grade
export const gradeSubmission = async (
  assignmentId: string,
  studentId: string,
  graderId: string,
  grade: number,
  feedback?: string
) => {
  // 1️⃣ Kiểm tra Assignment
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  // 2️⃣ Kiểm tra Submission
  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  // 3️⃣ Validate điểm
  const maxScore = assignment.maxScore || 10;
  appAssert(
    grade >= 0 && grade <= maxScore,
    BAD_REQUEST,
    `Grade must be between 0 and ${maxScore}`
  );

  // 4️⃣ Cập nhật thông tin chấm điểm
  submission.grade = grade;
  submission.feedback = feedback;
  submission.gradedBy = new mongoose.Types.ObjectId(graderId);
  submission.gradedAt = new Date();
  submission.status = SubmissionStatus.GRADED;

  // 5️⃣ Lưu lịch sử chấm điểm
  if (!submission.gradeHistory) {
    submission.gradeHistory = [];
  }
  submission.gradeHistory.push({
    grade,
    feedback: feedback || "",
    gradedBy: new mongoose.Types.ObjectId(graderId),
    gradedAt: new Date(),
  });

  await submission.save();

  // 6️⃣ Populate thông tin trả về
  return await submission.populate([
    { path: "studentId", select: "fullname email" },
    { path: "gradedBy", select: "fullname email" },
  ]);
};
