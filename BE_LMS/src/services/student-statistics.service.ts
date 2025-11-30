import { Types } from "mongoose";
import EnrollmentModel from "../models/enrollment.model";
import QuizModel from "../models/quiz.model";
import AssignmentModel from "../models/assignment.model";
import QuizAttemptModel from "../models/quizAttempt.model";
import SubmissionModel from "../models/submission.model";
import appAssert from "../utils/appAssert";
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from "../constants/http";
import { Role } from "../types/user.type";
import { CourseStatus } from "../types/course.type";
import { AttemptStatus } from "../types/quizAttempt.type";
import { SubmissionStatus } from "../types/submission.type";

type ObjectIdLike = Types.ObjectId | string;

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy thống kê chi tiết cho một enrollment cụ thể.
 * - Chỉ dành cho khóa học đã hoàn thành (COMPLETED).
 * - Phân quyền:
 *   + Student: Chỉ xem được của chính mình.
 *   + Teacher: Chỉ xem được học sinh trong khóa mình dạy.
 *   + Admin: Xem được tất cả.
 * - Logic mới:
 *   + Bỏ qua check thời gian droppedAt.
 *   + Trả về chi tiết từng quiz và assignment (title, score, status).
 */
export const getEnrollmentStatistics = async (params: {
    enrollmentId: string;
    userId: ObjectIdLike;
    role: Role;
}) => {
    const { enrollmentId, userId, role } = params;

    // 1. Load enrollment + populate
    const enrollment = await EnrollmentModel.findById(enrollmentId)
        .populate("studentId", "username fullname email avatar_url")
        .populate("courseId", "title code status completedAt teacherIds");

    appAssert(enrollment, NOT_FOUND, "Enrollment not found");

    const course = enrollment.courseId as any;
    const student = enrollment.studentId as any;

    // 2. Check Permission
    if (role === Role.STUDENT) {
        // Student chỉ xem được của chính mình
        const isOwner = student._id.toString() === userId.toString();
        appAssert(isOwner, FORBIDDEN, "You are not allowed to view this statistic");
    } else if (role === Role.TEACHER) {
        // Teacher chỉ xem được nếu dạy khóa này
        const isTeacherOfCourse = course.teacherIds.some((id: any) =>
            id.toString() === userId.toString()
        );
        appAssert(isTeacherOfCourse, FORBIDDEN, "You are not allowed to view this statistic");
    }
    // Admin được xem tất cả

    // 3. Check Course Status
    appAssert(
        course.status === CourseStatus.COMPLETED,
        BAD_REQUEST,
        "Course statistics are not available yet. The course must be completed first."
    );

    // 4. Fetch Detailed Data (Quizzes & Assignments)
    const courseId = course._id;
    const studentId = student._id;

    // Fetch all quizzes and assignments for the course first
    const [quizzes, assignments] = await Promise.all([
        QuizModel.find({ courseId }).select("title _id").lean(),
        AssignmentModel.find({ courseId }).select("title _id maxScore").lean(),
    ]);

    const quizIds = quizzes.map((q) => q._id);
    const assignmentIds = assignments.map((a) => a._id);

    // Then fetch attempts and submissions for these items
    const [quizAttempts, submissions] = await Promise.all([
        QuizAttemptModel.find({
            quizId: { $in: quizIds },
            studentId,
        }).lean(),
        SubmissionModel.find({
            assignmentId: { $in: assignmentIds },
            studentId,
        }).lean(),
    ]);

    // 5. Map Details
    // Map Quizzes
    const quizDetails = quizzes.map((quiz) => {
        // Find best attempt (highest score) or latest
        const attempts = quizAttempts.filter(
            (qa) => qa.quizId.toString() === quiz._id.toString() && qa.status === AttemptStatus.SUBMITTED
        );
        // Sort by score desc, then date desc
        attempts.sort((a, b) => (b.score || 0) - (a.score || 0));
        const bestAttempt = attempts[0];

        return {
            quizId: quiz._id,
            title: quiz.title,
            score: bestAttempt ? bestAttempt.score : 0,
            isCompleted: !!bestAttempt,
        };
    });

    // Map Assignments
    const assignmentDetails = assignments.map((asm) => {
        const sub = submissions.find(
            (s) => s.assignmentId.toString() === asm._id.toString() &&
                (s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.GRADED)
        );

        return {
            assignmentId: asm._id,
            title: asm.title,
            score: sub?.grade || 0,
            isCompleted: !!sub,
        };
    });

    // 6. Build Response Data
    const progress = enrollment.progress || {};

    // Calculate percentages/averages for summary
    const lessonsPercent = progress.totalLessons > 0
        ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
        : 0;

    const attendancePercent = progress.totalAttendances > 0
        ? Math.round((progress.completedAttendances / progress.totalAttendances) * 100)
        : 0;

    const quizAvg = progress.totalQuizzes > 0
        ? Math.round((progress.totalQuizScores / progress.totalQuizzes) * 100) / 100
        : 0;

    const assignmentAvg = progress.totalAssignments > 0
        ? Math.round((progress.totalAssignmentScores / progress.totalAssignments) * 100) / 100
        : 0;

    const totalAbsent = (progress.totalAttendances || 0) - (progress.completedAttendances || 0);

    return {
        enrollmentId: enrollment._id,
        course: {
            _id: course._id,
            title: course.title,
            code: course.code,
        },
        student: {
            _id: student._id,
            fullname: student.fullname,
            username: student.username,
            email: student.email,
            avatar_url: student.avatar_url,
        },
        finalGrade: enrollment.finalGrade,
        status: enrollment.status,
        completedAt: enrollment.completedAt,
        droppedAt: enrollment.droppedAt,
        summary: {
            lessonsPercent,
            attendancePercent,
            quizAvg,
            assignmentAvg,
            totalAbsent,
        },
        details: {
            lessons: {
                total: progress.totalLessons || 0,
                completed: progress.completedLessons || 0,
            },
            quizzes: {
                total: progress.totalQuizzes || 0,
                completed: progress.completedQuizzes || 0,
                totalScore: progress.totalQuizScores || 0,
                items: quizDetails,
            },
            assignments: {
                total: progress.totalAssignments || 0,
                completed: progress.completedAssignments || 0,
                totalScore: progress.totalAssignmentScores || 0,
                items: assignmentDetails,
            },
            attendance: {
                total: progress.totalAttendances || 0,
                present: progress.completedAttendances || 0,
                absent: totalAbsent,
            },
        },
    };
};
