import SubmissionModel from "../models/submission.model";
import AssignmentModel from "../models/assignment.model";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, BAD_REQUEST, FORBIDDEN } from "../constants/http";
import mongoose from "mongoose";
import {
  SubmissionStatus,
  SubmissionStats,
  GradeDistribution,
  SubmissionReportQuery,
} from "../types/submission.type";
import IAssignment from "../types/assignment.type";
import { UserModel } from "@/models";
import { Role } from "@/types";
import { uploadFile, getSignedUrl, deleteFilesByPrefix, removeFile } from "@/utils/uploadFile";
import { prefixSubmission } from "@/utils/filePrefix";
import { EnrollmentStatus } from "@/types/enrollment.type";
import { createNotification } from "./notification.service";
import { ensureTeacherAccessToCourse } from "./helpers/courseAccessHelpers";

//submit assign
export const submitAssignment = async ({
  studentId,
  assignmentId,
  file,
}: {
  studentId: mongoose.Types.ObjectId;
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

  const prefix = prefixSubmission(assignment.courseId, assignmentId, studentId);
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
 }:{ studentId: mongoose.Types.ObjectId,
  assignmentId: string,
  file:Express.Multer.File}
) => {

  appAssert(file,NOT_FOUND, "File is required");
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");
  //ktra quyền nộp lại
  const resubmittedAt = new Date();
  const isLate = assignment.dueDate && resubmittedAt > assignment.dueDate;
  if (isLate && !assignment.allowLate) {
  appAssert(false, BAD_REQUEST, "Submission deadline has expired");
}

  const submission = await SubmissionModel.findOne({ assignmentId, studentId });
  appAssert(submission, NOT_FOUND, "Submission not found");

  const prefix = prefixSubmission(assignment.courseId, assignmentId, studentId);

  if (submission.key) {
    try {
      await removeFile(submission.key as string);
    } catch (error) {
      console.error("Failed to remove old submission file", error);
    }
  } else {
    try {
      await deleteFilesByPrefix(prefix);
    } catch (error) {
      console.error("Failed to remove old submission files by prefix", error);
    }
  }

  const {key,originalName,mimeType,size} = await uploadFile(file,prefix);

  submission.originalName = originalName;
  submission.mimeType= mimeType;
  submission.size = size;
  submission.key = key;
  submission.submittedAt = resubmittedAt;
  submission.status = isLate ? SubmissionStatus.OVERDUE : SubmissionStatus.RESUBMITTED;

  await submission.save();
  return await submission.populate("assignmentId","title dueDate");
};

 //xem status bài nộp
export const getSubmissionStatus = async (
  studentId: mongoose.Types.ObjectId,
  assignmentId: string
) => {

  const student = await UserModel.findOne({ _id: studentId, role: Role.STUDENT });
  appAssert(student, NOT_FOUND, "Student not found");

  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

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

//get sub by Id,và load file
export const getSubmissionById = async (
  submissionId: string,
  requesterId: mongoose.Types.ObjectId,
  requesterRole?: Role
) => {
  const submission = await SubmissionModel.findById(submissionId)
    .populate("assignmentId", "title dueDate allowLate maxScore courseId")
    .populate("gradedBy", "fullname email");

  appAssert(submission, NOT_FOUND, "Submission not found");

  const submissionStudentId = submission.studentId as mongoose.Types.ObjectId;

  //nếu std
  if (requesterRole === Role.STUDENT || !requesterRole) {
    appAssert(
      submissionStudentId.toString() === requesterId.toString(),
      FORBIDDEN,
      "You can only view your own submission"
    );
  }
  //nếu teacher
  else if (requesterRole === Role.TEACHER) {
    const assignment = submission.assignmentId as any;
    const courseRef = assignment?.courseId;
    appAssert(courseRef, NOT_FOUND, "Course not found for this assignment");

    await ensureTeacherAccessToCourse({
      course: courseRef,
      courseId: (courseRef as any)?._id || courseRef,
      userId: requesterId,
      userRole: requesterRole,
    });
  }

  //tajo presigned URL cho file
  let publicURL: string | null = null;
  if (submission.key) {
    publicURL = await getSignedUrl(submission.key, submission.originalName);
  }

  return {
    ...submission.toObject(),
    publicURL,
  };
};

//hàm bổ sung, ds bài nộp theo assignment cho GV
type ListSubmissionsByAssignmentParams = {
  assignmentId: string;
  from?: Date;
  to?: Date;
  requesterId?: mongoose.Types.ObjectId;
  requesterRole?: Role;
};

export const listSubmissionsByAssignment = async ({
  assignmentId,
  from,
  to,
  requesterId,
  requesterRole,
}: ListSubmissionsByAssignmentParams) => {
  const assignment = await AssignmentModel.findById(assignmentId).select("courseId");
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  await ensureTeacherAccessToCourse({
    courseId: assignment.courseId as mongoose.Types.ObjectId,
    userId: requesterId,
    userRole: requesterRole,
  });

  const filter: any = { assignmentId };

  if (from || to) {
    filter.submittedAt = {};
    if (from) filter.submittedAt.$gte = from;
    if (to) filter.submittedAt.$lte = to;
  }

  return SubmissionModel.find(filter)
    .populate("studentId", "fullname email")
    .sort({ submittedAt: -1 });
};

//grade
export const gradeSubmission = async (
  assignmentId: string,
  studentId: mongoose.Types.ObjectId,
  graderId: mongoose.Types.ObjectId,
  grade: number,
  feedback?: string,
  graderRole?: Role
) => {
  const student = await UserModel.findOne({ _id: studentId, role: Role.STUDENT });
  appAssert(student, BAD_REQUEST, "Missing user ID");
  //Kiểm tra Assignment
  const assignment = await AssignmentModel.findById(assignmentId);
  appAssert(assignment, NOT_FOUND, "Assignment not found");

  await ensureTeacherAccessToCourse({
    courseId: assignment.courseId as mongoose.Types.ObjectId,
    userId: graderId,
    userRole: graderRole,
  });

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
  submission.gradedBy = graderId;
  submission.gradedAt = new Date();
  submission.status = SubmissionStatus.GRADED;

  // Lưu lịch sử chấm điểm
  if (!submission.gradeHistory) {
    submission.gradeHistory = [];
  }
  submission.gradeHistory.push({
    grade,
    feedback: feedback || "",
    gradedBy: graderId,
    gradedAt: new Date(),
  });

  await submission.save();

  await notifyStudentOfGrading({
    studentId,
    graderId,
    graderRole,
    assignmentTitle: assignment.title || "Assignment",
    grade,
    maxScore,
  });

  //Populate thông tin trả về
  return await submission.populate([
    { path: "studentId", select: "fullname email" },
    { path: "gradedBy", select: "fullname email" },
  ]);
};

// grade by submission id 
export const gradeSubmissionById = async (
  submissionId: string,
  graderId: mongoose.Types.ObjectId,
  grade: number,
  feedback?: string,
  graderRole?: Role
) => {
  const submission = await SubmissionModel.findById(submissionId).populate({
    path: "assignmentId",
    select: "title maxScore courseId",
  });
  appAssert(submission, NOT_FOUND, 'Submission not found');

  const assignment: any = submission.assignmentId;
  await ensureTeacherAccessToCourse({
    courseId: assignment?.courseId,
    userId: graderId,
    userRole: graderRole,
  });
  const maxScore = assignment?.maxScore ?? 10;
  appAssert(
    grade >= 0 && grade <= maxScore,
    BAD_REQUEST,
    `Grade must be between 0 and ${maxScore}`
  );

  submission.grade = grade;
  submission.feedback = feedback;
  submission.gradedBy = graderId;
  submission.gradedAt = new Date();
  submission.status = SubmissionStatus.GRADED;

  if (!submission.gradeHistory) submission.gradeHistory = [];
  submission.gradeHistory.push({
    grade,
    feedback: feedback || '',
    gradedBy: graderId,
    gradedAt: new Date(),
  });

  const studentRef = submission.studentId as mongoose.Types.ObjectId | string;

  await submission.save();

  await notifyStudentOfGrading({
    studentId: studentRef,
    graderId,
    graderRole,
    assignmentTitle: assignment?.title || "Assignment",
    grade,
    maxScore,
  });

  return await submission.populate([
    { path: 'studentId', select: 'fullname email' },
    { path: 'gradedBy', select: 'fullname email' },
    { path: 'assignmentId', select: 'title maxScore' },
  ]);
};

export const listAllGradesByStudent = async (
  studentId: mongoose.Types.ObjectId,
  from?: Date,
  to?: Date
  ) => {
  const student = await UserModel.findOne({ _id: studentId, role: Role.STUDENT });
  appAssert(student, NOT_FOUND, "Student not found");

  const filter: any = { studentId };
  if (from || to) {
    filter.submittedAt = {};
    if (from) filter.submittedAt.$gte = from;
    if (to) filter.submittedAt.$lte = to;
  }

  //lấy toàn bộ submission của sv
  const submissions = await SubmissionModel.find(filter)
    .populate({
      path: "assignmentId",
      select: "title dueDate courseId maxScore",
      populate: { path: "courseId", select: "title code" },
    })
    .populate("gradedBy", "fullname email")
    .sort({ gradedAt: -1, submittedAt: -1 });

  if (!submissions.length) {
    return {
      total: 0,
      average: null,
      grades: [],
    };
  }

  // tính đtb
  // const gradedSubs = submissions.filter((s) => s.grade !== undefined);
  // const average =
  //   gradedSubs.length > 0
  //     ? Number(
  //         (
  //           gradedSubs.reduce((sum, s) => sum + (s.grade ?? 0), 0) /
  //           gradedSubs.length
  //         ).toFixed(2)
  //       )
  //     : null;

  //dữ liệu trả về
  const grades = submissions.map((s: any) => {
    const assignment = s.assignmentId as any;
    const submissionId = s._id ? String(s._id) : null;
    return {
      submissionId,
      courseName: assignment?.courseId?.title || "Unknown course",
      assignmentTitle: assignment?.title,
      maxScore: assignment?.maxScore ?? 10,
      grade: s.grade ?? null,
      feedback: s.feedback ?? "",
      status: s.status,
      isLate: s.isLate,
      submittedAt: s.submittedAt,
      gradedAt: s.gradedAt,
      teacher: s.gradedBy && (s.gradedBy as any).fullname ? (s.gradedBy as any).fullname : null,
    };
  });

  return {
    total: submissions.length,
    // average,
    grades,
  };
};

//static and report

// 1. Get Submission Statistics
type SubmissionStatsParams = {
  assignmentId: string;
  requesterId?: mongoose.Types.ObjectId;
  requesterRole?: Role;
};

export const getSubmissionStats = async ({
  assignmentId,
  requesterId,
  requesterRole,
}: SubmissionStatsParams) => {
    const assignment = await AssignmentModel.findById(assignmentId).populate({
      path: "courseId",
      select: "teacherIds title",
    });
    appAssert(assignment, NOT_FOUND, "Assignment not found");

    await ensureTeacherAccessToCourse({
      course: assignment.courseId,
      courseId: (assignment.courseId as any)?._id || assignment.courseId,
      userId: requesterId,
      userRole: requesterRole,
    });

    const totalStudents = await EnrollmentModel.countDocuments({ 
      courseId: assignment.courseId._id,
      status: EnrollmentStatus.APPROVED
    });

    const submissions = await SubmissionModel.find({ assignmentId });

    const submittedCount = submissions.length;
    const onTime = submissions.filter((s) => s.status !== "overdue").length;
    const late = submissions.filter((s) => s.status === "overdue").length;
    const graded = submissions.filter((s) => s.grade !== undefined);
    const averageGrade = graded.length > 0 ? graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length : null;
    return {
          totalStudents,
          submissionRate: `${totalStudents ? ((submittedCount / totalStudents) * 100).toFixed(2) : 0}%`,
          onTimeRate: `${submittedCount ? ((onTime / submittedCount) * 100).toFixed(2) : 0}%`,
          averageGrade,
        };
};

//grade Distribution
export const getGradeDistribution = async (assignmentId: string) => {
    const assignment = await AssignmentModel.exists({ _id: assignmentId });
    appAssert(assignment, NOT_FOUND, "Assignment not found");

    const submissions = await SubmissionModel.find({
      assignmentId,
      grade: { $ne: undefined },
    });
    const ranges = [
      { key: "0-2", min: 0, max: 2 },
      { key: "2-4", min: 2, max: 4 },
      { key: "4-6", min: 4, max: 6 },
      { key: "6-8", min: 6, max: 8 },
      { key: "8-10", min: 8, max: 10 },
    ];

    const total = submissions.length || 1;
    return ranges.map((r) => {
    const count = submissions.filter((s) => s.grade! >= r.min && s.grade! < r.max).length;
        return {
          range: r.key,
          count,
          percentage: `${((count / total) * 100).toFixed(2)}%`,
          };
        });
};

export const getSubmissionReportByAssignment = async (
    assignmentId: string,
    query?: SubmissionReportQuery,
    requesterId?: mongoose.Types.ObjectId,
    requesterRole?: Role
    ) => {
    const stats = await getSubmissionStats({ assignmentId, requesterId, requesterRole });
    const distribution = await getGradeDistribution(assignmentId);

    const filter: any = { assignmentId };
        if (query?.from || query?.to) {
        filter.submittedAt = {};
        if (query.from) filter.submittedAt.$gte = query.from;
        if (query.to) filter.submittedAt.$lte = query.to;
      }

    const details = await SubmissionModel.find(filter)
        .populate("studentId", "fullname email")
        .populate("gradedBy", "fullname email")
        .sort({ submittedAt: -1 });
        return { stats, distribution, details };
};

// 4. Report by Course
export const getSubmissionReportByCourse = async (
  courseId: string,
  requesterId?: mongoose.Types.ObjectId,
  requesterRole?: Role
) => {
    await ensureTeacherAccessToCourse({
      courseId,
      userId: requesterId,
      userRole: requesterRole,
    });

    const assignments = await AssignmentModel.find({ courseId }) as IAssignment[];
    const reports = [];

    for (const a of assignments) {
        const assignmentId = (a as any)._id && (a as any)._id.toHexString ? (a as any)._id.toHexString() : String((a as any)._id);
        const stats = await getSubmissionStats({
          assignmentId,
          requesterId,
          requesterRole,
        });
        const distribution = await getGradeDistribution(assignmentId);
        reports.push({ assignment: a.title, stats, distribution });
        }
    return reports;
};

const isTeacherOrAdmin = (role?: Role | null): role is Role =>
  !!role && [Role.TEACHER, Role.ADMIN].includes(role);

const notifyStudentOfGrading = async ({
  studentId,
  graderId,
  graderRole,
  assignmentTitle,
  grade,
  maxScore,
}: {
  studentId: mongoose.Types.ObjectId | string;
  graderId: mongoose.Types.ObjectId;
  graderRole?: Role | null;
  assignmentTitle: string;
  grade: number;
  maxScore: number;
}) => {
  if (!isTeacherOrAdmin(graderRole)) {
    return;
  }

  if (!studentId) {
    return;
  }

  const recipientUser =
    typeof studentId === "string"
      ? studentId
      : (studentId as mongoose.Types.ObjectId).toHexString();

  const title = `Grade posted: ${assignmentTitle}`;
  const message = `Your submission for "${assignmentTitle}" has been graded. Score: ${grade}/${maxScore}. Check the feedback for details.`;

  try {
    await createNotification(
      {
        title,
        message,
        recipientType: "user",
        recipientUser,
      },
      graderId,
      graderRole
    );
  } catch (error) {
    console.error("Failed to send grading notification", error);
  }
};