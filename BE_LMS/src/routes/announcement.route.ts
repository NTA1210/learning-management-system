import { Router } from "express";
import {
    createAnnouncementHandler,
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

export default announcementRoutes;
