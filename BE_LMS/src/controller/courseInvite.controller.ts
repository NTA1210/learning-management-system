import { CREATED } from "@/constants/http";
import { catchErrors } from "@/utils/asyncHandler";
import { createCourseInviteSchema } from "@/validators/courseInvite.schemas";
import { createCourseInvite } from "@/services/courseInvite.service";

/**
 * POST /course-invites
 * Tạo link mời tham gia khóa học
 * Chỉ Teacher/Admin
 */
export const createCourseInviteHandler = catchErrors(async (req, res) => {
  const request = createCourseInviteSchema.parse(req.body);
  const createdBy = req.userId!.toString();

  const result = await createCourseInvite(request, createdBy);

  return res.success(CREATED, {
    data: result,
    message: "Invite link created successfully",
  });
});
