import { catchErrors } from "../utils/asyncHandler";
import { CREATED, OK } from "../constants/http";
import {
    createAnnouncementSchema,
    announcementIdSchema,
    courseIdParamSchema,
    getAnnouncementsQuerySchema,
} from "../validators/announcement.schemas";
import {
    createAnnouncement,
    getAnnouncementsByCourse,
    getAnnouncementById,
} from "../services/announcement.service";

/**
 * POST /announcements
 * Create a new announcement
 */
export const createAnnouncementHandler = catchErrors(async (req, res) => {
    const data = createAnnouncementSchema.parse(req.body);
    const userId = req.userId;
    const userRole = req.role;

    const announcement = await createAnnouncement(data, userId, userRole);

    return res.success(CREATED, {
        data: announcement,
        message: "Announcement created successfully",
    });
});

/**
 * GET /announcements/course/:courseId
 * Get all announcements for a course
 */
export const getAnnouncementsByCourseHandler = catchErrors(async (req, res) => {
    const courseId = courseIdParamSchema.parse(req.params.courseId);
    const { page, limit } = getAnnouncementsQuerySchema.parse(req.query);

    const result = await getAnnouncementsByCourse(courseId, page, limit);

    return res.success(OK, {
        data: result.announcements,
        pagination: result.pagination,
        message: "Announcements retrieved successfully",
    });
});

/**
 * GET /announcements/:id
 * Get announcement details
 */
export const getAnnouncementByIdHandler = catchErrors(async (req, res) => {
    const announcementId = announcementIdSchema.parse(req.params.id);

    const announcement = await getAnnouncementById(announcementId);

    return res.success(OK, {
        data: announcement,
        message: "Announcement retrieved successfully",
    });
});
