import { Router } from "express";
import { createCourseInviteHandler, joinCourseInviteHandler, listCourseInvitesHandler, updateCourseInviteHandler, deleteCourseInviteHandler } from "@/controller/courseInvite.controller";
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

/**
 * GET /course-invites
 * Lấy danh sách các lời mời tham gia khóa học
 * Chỉ Teacher/Admin
 */
courseInviteRoutes.get(
  "/",
  authorize(Role.TEACHER, Role.ADMIN),
  listCourseInvitesHandler
);

/**
 * PATCH /course-invites/:id
 * Cập nhật thông tin invite link
 * Chỉ Teacher/Admin
 */
courseInviteRoutes.patch(
  "/:id",
  authorize(Role.TEACHER, Role.ADMIN),
  updateCourseInviteHandler 
);

/**
 * DELETE /course-invites/:id
 * Xóa invite link vĩnh viễn (soft delete)
 * Chỉ Teacher/Admin
 */
courseInviteRoutes.delete(
  "/:id",
  authorize(Role.TEACHER, Role.ADMIN),
  deleteCourseInviteHandler
);