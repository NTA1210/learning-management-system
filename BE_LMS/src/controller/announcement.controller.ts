import { catchErrors } from "../utils/asyncHandler";
import { CREATED } from "../constants/http";
import {
    createAnnouncementSchema,
} from "../validators/announcement.schemas";
import {
    createAnnouncement,
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
