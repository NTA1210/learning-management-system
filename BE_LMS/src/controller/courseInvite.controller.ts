import { CREATED, OK } from "@/constants/http";
import { catchErrors } from "@/utils/asyncHandler";
import { courseInviteIdSchema, createCourseInviteSchema, updateCourseInviteSchema, joinCourseInviteSchema } from "@/validators/courseInvite.schemas";
import { createCourseInvite, joinCourseByInvite, updateCourseInvite, deleteCourseInvite } from "@/services/courseInvite.service";

/**
 * POST /course-invites
 * Tạo link mời tham gia khóa học
 * Chỉ Teacher/Admin
 */
export const createCourseInviteHandler = catchErrors(async (req, res) => {
  const request = createCourseInviteSchema.parse(req.body);
  const createdBy = req.userId!;

  const result = await createCourseInvite(request, createdBy);

  return res.success(CREATED, {
    data: result,
    message: "Invite link created successfully",
  });
});

/**
 * GET /course-invites
 * Lấy danh sách các lời mời tham gia khóa học
 * Chỉ Teacher/Admin
 */
export const joinCourseInviteHandler = catchErrors(async (req, res) => {
  const request = joinCourseInviteSchema.parse(req.body);
  const userId = req.userId!;

  const result = await joinCourseByInvite(request.token, userId);
  return res.success(OK, {
    data: result,
    message: result.message,
  });
})

/**
 * GET /course-invites
 * Lấy danh sách các lời mời tham gia khóa học
 * Chỉ Teacher/Admin
 */
import { listCourseInvitesSchema } from "@/validators/courseInvite.schemas";
import { listCourseInvites } from "@/services/courseInvite.service";

export const listCourseInvitesHandler = catchErrors(async (req, res) => {
  const query = listCourseInvitesSchema.parse(req.query);
  const viewerId = req.userId!;
  const viewerRole = req.role!;

  const result = await listCourseInvites(query, viewerId, viewerRole);

  return res.success(OK, {
    data: result.invites,
    pagination: result.pagination,
    message: "Course invites retrieved successfully",
  });
});

/**
 * PATCH /course-invites/:id
 * Cập nhật thông tin invite link
 * Chỉ Teacher/Admin
 */
export const updateCourseInviteHandler = catchErrors(async (req, res) => {
  const { id } = courseInviteIdSchema.parse(req.params);
  const request = updateCourseInviteSchema.parse(req.body);
  const updatedBy = req.userId!;

  const result = await updateCourseInvite(id, request, updatedBy);

  return res.success(OK, {
    data: result,
    message: "Course invite updated successfully",
  });
});

/**
 * DELETE /course-invites/:id
 * Xóa invite link vĩnh viễn (soft delete)
 * Chỉ Teacher/Admin
 */
export const deleteCourseInviteHandler = catchErrors(async (req, res) => {
  const { id } = courseInviteIdSchema.parse(req.params);
  const userId = req.userId!;

  const result = await deleteCourseInvite(id, userId);

  return res.success(OK, {
    data: result,
    message: result.message,
  });
});
