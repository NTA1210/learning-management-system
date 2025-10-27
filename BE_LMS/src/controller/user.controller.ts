import { listAllUsersSchema } from "@/validators/user.schemas";
import { NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { catchErrors } from "../utils/asyncHandler";
import { courseIdSchema } from "@/validators";
import { getAllUsers } from "@/services/user.service";

// GET /users/:courseId - Get all users for a specific course
export const getUserForCourseHandler = catchErrors(async (req, res) => {
  const request = listAllUsersSchema.parse(req.query);
  const courseId = courseIdSchema.parse(req.params.courseId);

  const data = await getAllUsers(courseId, request, req.role);

  return res.success(OK, data.users, "Users retrieved successfully", {
    pagination: data.pagination,
  });
});

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req?.userId);
  appAssert(user, NOT_FOUND, "User not found");

  return res.status(OK).json(user.omitPassword());
});
