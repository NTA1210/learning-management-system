import { Router } from "express";
import {
    createAnnouncementHandler,
    getAnnouncementsByCourseHandler,
    getAnnouncementByIdHandler,
    updateAnnouncementHandler,
    deleteAnnouncementHandler,
} from "../controller/announcement.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types/user.type";

const announcementRoutes = Router();

// prefix: /announcements

// POST /announcements - Create new announcement (Teacher/Admin only)
announcementRoutes.post(
    "/",
    authorize(Role.TEACHER, Role.ADMIN),
    createAnnouncementHandler
);

// GET /announcements/course/:courseId - Get all announcements for a course
announcementRoutes.get(
    "/course/:courseId",
    getAnnouncementsByCourseHandler
);

// GET /announcements/:id - Get announcement details
announcementRoutes.get("/:id", getAnnouncementByIdHandler);

// PUT /announcements/:id - Update announcement (Teacher/Admin only)
announcementRoutes.put(
    "/:id",
    authorize(Role.TEACHER, Role.ADMIN),
    updateAnnouncementHandler
);

// DELETE /announcements/:id - Delete announcement (Teacher/Admin only)
announcementRoutes.delete(
    "/:id",
    authorize(Role.TEACHER, Role.ADMIN),
    deleteAnnouncementHandler
);

export default announcementRoutes;
