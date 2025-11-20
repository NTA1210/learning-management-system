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
