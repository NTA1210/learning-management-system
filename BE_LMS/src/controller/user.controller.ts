import { listAllUsersSchema } from "@/validators/user.schemas";
import { NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { catchErrors } from "../utils/asyncHandler";
import { getAllUsers } from "@/services/user.service";

// GET /users/:courseId - Get all users for a specific course
export const getUserForCourseHandler = catchErrors(async (req, res) => {
  const request = listAllUsersSchema.parse(req.query);
  const role = req.role;

  const { data, pagination } = await getAllUsers(request, role);

  return res.success(OK, {
    data,
    message: "Users retrieved successfully",
    pagination,
  });
});

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req?.userId);
  appAssert(user, NOT_FOUND, "User not found");

  return res.status(OK).json(user.omitPassword());
});
