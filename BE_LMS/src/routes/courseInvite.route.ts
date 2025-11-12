import { Router } from "express";
import { createCourseInviteHandler, joinCourseInviteHandler } from "@/controller/courseInvite.controller";
import { authorize } from "@/middleware";
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
  authorize(Role.TEACHER, Role.ADMIN),
  createCourseInviteHandler
);
/**
 * POST /course-invites/join
 * Student join khóa học bằng token
 * Yêu cầu authenticate (phải login)
 */
courseInviteRoutes.post(
  "/join",
  joinCourseInviteHandler
);

export default courseInviteRoutes;
