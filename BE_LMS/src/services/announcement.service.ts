import AnnouncementModel from "../models/announcement.model";
import CourseModel from "../models/course.model";
import appAssert from "../utils/appAssert";
import { FORBIDDEN, NOT_FOUND } from "../constants/http";
import {
    CreateAnnouncementInput,
} from "../validators/announcement.schemas";
import { Role } from "../types/user.type";
import { Types } from "mongoose";

/**
 * Yêu cầu nghiệp vụ:
 * - Tạo thông báo mới cho một khóa học.
 * - Kiểm tra khóa học có tồn tại không.
 * - Người tạo phải là Admin hoặc Teacher.
 *
 * Input: data (title, content, courseId), userId, userRole
 * Output: Announcement document
 */
export const createAnnouncement = async (
    data: CreateAnnouncementInput,
    userId: Types.ObjectId,
    userRole: Role
) => {
    // Validate course existence
    const course = await CourseModel.findById(data.courseId);
    appAssert(course, NOT_FOUND, `Course ${data.courseId} not found`);

    // Check permission: Only Admin or Teacher OF THE COURSE can create announcement
    const isAdmin = userRole === Role.ADMIN;
    // Check if user is in teacherIds list
    const isTeacherOfCourse = course.teacherIds.some(
        (id) => id.equals(userId)
    );

    appAssert(
        isAdmin || isTeacherOfCourse,
        FORBIDDEN,
        "Only Admin or Teacher of this course can create announcements"
    );

    const announcement = await AnnouncementModel.create({
        ...data,
        authorId: userId,
    });

    return announcement;
};

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy danh sách thông báo của một khóa học.
 * - Sắp xếp theo thời gian đăng giảm dần (mới nhất lên đầu).
 * - Có thể phân trang (page, limit).
 *
 * Input: courseId, page, limit
 * Output: List announcements, pagination info
 */
export const getAnnouncementsByCourse = async (
    courseId: string,
    page: number = 1,
    limit: number = 10
) => {
    const skip = (page - 1) * limit;

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    appAssert(course, NOT_FOUND, `Course ${courseId} not found`);

    // Parallel queries for better performance
    const [announcements, total] = await Promise.all([
        AnnouncementModel.find({ courseId })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("authorId", "username fullname avatar_url")
            .lean(),
        AnnouncementModel.countDocuments({ courseId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        announcements,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
    };
};

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy chi tiết một thông báo.
 *
 * Input: announcementId
 * Output: Announcement detail
 */
export const getAnnouncementById = async (announcementId: string) => {
    const announcement = await AnnouncementModel.findById(announcementId)
        .populate("authorId", "username fullname avatar_url")
        .populate("courseId", "title")
        .lean();

    appAssert(announcement, NOT_FOUND, `Announcement ${announcementId} not found`);

    return announcement;
};
