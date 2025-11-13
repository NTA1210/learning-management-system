import { Router } from "express";
import { createCourseInviteHandler } from "@/controller/courseInvite.controller";
import { authenticate, authorize } from "@/middleware";
import { Role } from "@/types";

const courseInviteRoutes = Router();

// prefix: /course-invites

/**
 * POST /course-invites
 * Tạo invite link cho khóa học
 * Chỉ Teacher/Admin
 */
courseInviteRoutes.post(
  "/",
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  createCourseInviteHandler
);

export default courseInviteRoutes;
