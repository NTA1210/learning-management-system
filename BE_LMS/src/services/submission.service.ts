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
export const submitAssignment = async ({
  studentId,
  assignmentId,
  file,
}: {
  studentId: string;
  assignmentId: string;
  file: Express.Multer.File;
}) => {
  const student = await UserModel.findOne({ _id: studentId, role: Role.STUDENT });
  appAssert(student, BAD_REQUEST, "Missing user ID");
  appAssert(file,NOT_FOUND, "File is required");

  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  // Kiểm tra nộp trễ
  const submittedAt = new Date();
  const isLate = assignment.dueDate && submittedAt > assignment.dueDate;
  if (isLate && !assignment.allowLate) {
    appAssert(false, BAD_REQUEST, "Submission deadline has expired");
  }

  // Kiểm tra đã nộp chưa
  const existing = await SubmissionModel.findOne({ assignmentId, studentId });
  if (existing) {
    appAssert(
      assignment.allowLate,
      BAD_REQUEST,
      "You already submitted and resubmission is not allowed"
    );
    return existing;
  }

  const prefix = prefixSubmission(assignment.courseId.toString(), assignmentId, studentId);
  const { key, originalName, mimeType, size } = await uploadFile(file, prefix);

  const submission = await SubmissionModel.create({
    assignmentId,
    studentId,
    originalName,
    mimeType,
    size,
    key,
    submittedAt,
    status: isLate ? SubmissionStatus.OVERDUE : SubmissionStatus.SUBMITTED,
  });

  return await submission.populate("assignmentId", "title dueDate");
};
 //sửa bt resubmit
 // Chỉ cho phép nếu assignment.allowLate === true
export const resubmitAssignment = async (
  {
  studentId,
  assignmentId,
  file
 }:{ studentId: string,
  assignmentId: string,
  file:Express.Multer.File}
) => {

  appAssert(file,NOT_FOUND, "File is required");
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");
  //ktra quyền nộp lại
  appAssert(assignment.allowLate, BAD_REQUEST, "Resubmission is not allowed");

  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  const resubmittedAt = new Date();
  const isLate = assignment.dueDate && resubmittedAt > assignment.dueDate;
  const prefix = prefixSubmission(assignment.courseId.toString(),assignmentId,studentId);
  const {key,originalName,mimeType,size} = await uploadFile(file,prefix);

  submission.originalName = originalName;
  submission.mimeType = mimeType;
  submission.size = size;
  submission.key = key;
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
  const student = await UserModel.findOne({ _id: studentId, role: Role.STUDENT });
  appAssert(student, BAD_REQUEST, "Missing user ID");
  //Kiểm tra Assignment
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  //Kiểm tra Submission
  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  // Validate điểm
  const maxScore = assignment.maxScore || 10;
  appAssert(
    grade >= 0 && grade <= maxScore,
    BAD_REQUEST,
    `Grade must be between 0 and ${maxScore}`
  );

  //Cập nhật thông tin chấm điểm
  submission.grade = grade;
  submission.feedback = feedback;
  submission.gradedBy = new mongoose.Types.ObjectId(graderId);
  submission.gradedAt = new Date();
  submission.status = SubmissionStatus.GRADED;

  // Lưu lịch sử chấm điểm
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

  //Populate thông tin trả về
  return await submission.populate([
    { path: "studentId", select: "fullname email" },
    { path: "gradedBy", select: "fullname email" },
  ]);
};
