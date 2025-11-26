import NotificationModel from '../../models/notification.model';
import { NotificationRecipientType } from '../../types/notification.type';
import UserModel from '../../models/user.model';
import CourseModel from '../../models/course.model';
import { Role } from '../../types';

/**
 * Gửi notification khi có feedback mới cho hệ thống
 * → Thông báo tới tất cả Admin
 */
export async function notifyNewSystemFeedback(
    feedbackId: string,
    feedbackContent: string,
    userName: string
) {
    // Tìm tất cả Admin
    const admins = await UserModel.find({ role: Role.ADMIN }).select('_id');

    if (admins.length === 0) return;

    // Tạo notification cho từng admin
    const notifications = admins.map(admin => ({
        title: 'Feedback mới cho hệ thống',
        message: `${userName} đã gửi feedback: "${feedbackContent.substring(0, 100)}..."`,
        recipientUser: admin._id,
        recipientType: NotificationRecipientType.SYSTEM,
        isRead: false,
    }));

    await NotificationModel.insertMany(notifications);
}

/**
 * Gửi notification khi có feedback về Teacher
 * → Chỉ thông báo tới Admin (KHÔNG thông báo cho Teacher)
 */
export async function notifyTeacherFeedback(
    teacherId: string,
    feedbackContent: string,
    rating: number,
    userName: string
) {
    // Chỉ thông báo cho Admin, không thông báo cho Teacher (theo nghiệp vụ)
    const admins = await UserModel.find({ role: Role.ADMIN }).select('_id');

    if (admins.length === 0) return;

    const notifications = admins.map(admin => ({
        title: 'Feedback mới về giảng viên',
        message: `${userName} đã đánh giá giảng viên với ${rating}/5 sao: "${feedbackContent.substring(0, 100)}..."`,
        recipientUser: admin._id,
        recipientType: NotificationRecipientType.SYSTEM,
        isRead: false,
    }));

    await NotificationModel.insertMany(notifications);
}

/**
 * Gửi notification khi có feedback về Course
 * → Thông báo tới Teachers của course + Admin
 */
export async function notifyCourseFeedback(
    courseId: string,
    feedbackContent: string,
    rating: number,
    userName: string
) {
    // Tìm course và teachers
    const course = await CourseModel.findById(courseId).select('title teacherIds');

    if (!course) return;

    const recipients: Array<{
        title: string;
        message: string;
        recipientUser: any;
        recipientType: string;
        isRead: boolean;
    }> = [];

    // Thêm teachers vào danh sách nhận
    if (course.teacherIds && course.teacherIds.length > 0) {
        course.teacherIds.forEach(teacherId => {
            recipients.push({
                title: 'Khóa học của bạn nhận đánh giá mới',
                message: `${userName} đã đánh giá khóa học "${course.title}" với ${rating}/5 sao: "${feedbackContent.substring(0, 100)}..."`,
                recipientUser: teacherId,
                recipientType: NotificationRecipientType.SYSTEM,
                isRead: false,
            });
        });
    }

    // Thêm admins vào danh sách nhận
    const admins = await UserModel.find({ role: Role.ADMIN }).select('_id');
    admins.forEach(admin => {
        recipients.push({
            title: 'Feedback mới về khóa học',
            message: `${userName} đã đánh giá khóa học "${course.title}" với ${rating}/5 sao`,
            recipientUser: admin._id,
            recipientType: NotificationRecipientType.SYSTEM,
            isRead: false,
        });
    });

    if (recipients.length > 0) {
        await NotificationModel.insertMany(recipients);
    }
}

/**
 * Gửi notification cho Admin khi Teacher tạo khóa học mới
 */
export async function notifyAdminNewCourse(
    courseId: string,
    courseTitle: string,
    teacherName: string
) {
    const admins = await UserModel.find({ role: Role.ADMIN }).select('_id');
    if (admins.length === 0) return;

    const notifications = admins.map(admin => ({
        title: 'Khóa học mới chờ duyệt',
        message: `Giáo viên ${teacherName} vừa tạo khóa học mới "${courseTitle}", đang chờ duyệt.`,
        recipientUser: admin._id,
        recipientCourse: courseId,
        recipientType: NotificationRecipientType.SYSTEM,
        isRead: false,
    }));

    await NotificationModel.insertMany(notifications);
}

/**
 * Gửi notification cho Teacher khi khóa học được duyệt
 */
export async function notifyTeacherCourseApproved(
    courseId: string,
    courseTitle: string,
    teacherId: string
) {
    await NotificationModel.create({
        title: 'Khóa học đã được duyệt',
        message: `Khóa học "${courseTitle}" của bạn đã được duyệt và công khai.`,
        recipientUser: teacherId,
        recipientCourse: courseId,
        recipientType: NotificationRecipientType.SYSTEM,
        isRead: false,
    });
}

/**
 * Gửi notification cho Teacher khi được phân công vào khóa học
 */
export async function notifyTeacherAssigned(
    courseId: string,
    courseTitle: string,
    teacherIds: string[]
) {
    if (!teacherIds || teacherIds.length === 0) return;

    const notifications = teacherIds.map(teacherId => ({
        title: 'Phân công giảng dạy',
        message: `Bạn đã được phân công dạy khóa học "${courseTitle}".`,
        recipientUser: teacherId,
        recipientCourse: courseId,
        recipientType: NotificationRecipientType.SYSTEM,
        isRead: false,
    }));

    await NotificationModel.insertMany(notifications);
}
