import { catchErrors } from "../utils/asyncHandler";
import { CREATED, OK } from "../constants/http";
import {
    createAnnouncementSchema,
    updateAnnouncementSchema,
    announcementIdSchema,
    courseIdParamSchema,
    getAnnouncementsQuerySchema,
} from "../validators/announcement.schemas";
import {
    createAnnouncement,
    getAnnouncementsByCourse,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements,
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
 * GET /announcements
 * Get all announcements (Admin/Teacher)
 */
export const getAllAnnouncementsHandler = catchErrors(async (req, res) => {
    const { page, limit } = getAnnouncementsQuerySchema.parse(req.query);

    const result = await getAllAnnouncements(page, limit);

    return res.success(OK, {
        data: result.announcements,
        pagination: result.pagination,
        message: "All announcements retrieved successfully",
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

/**
 * PUT /announcements/:id
 * Update an announcement
 */
export const updateAnnouncementHandler = catchErrors(async (req, res) => {
    const announcementId = announcementIdSchema.parse(req.params.id);
    const data = updateAnnouncementSchema.parse(req.body);
    const userId = req.userId;
    const userRole = req.role;

    const updatedAnnouncement = await updateAnnouncement(
        announcementId,
        data,
        userId,
        userRole
    );

    return res.success(OK, {
        data: updatedAnnouncement,
        message: "Announcement updated successfully",
    });
});

/**
 * DELETE /announcements/:id
 * Delete an announcement
 */
export const deleteAnnouncementHandler = catchErrors(async (req, res) => {
    const announcementId = announcementIdSchema.parse(req.params.id);
    const userId = req.userId;
    const userRole = req.role;

    const result = await deleteAnnouncement(announcementId, userId, userRole);

    return res.success(OK, {
        message: result.message,
    });
});
