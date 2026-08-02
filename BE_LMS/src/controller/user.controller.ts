import { listAllUsersSchema, updateUserProfileSchema } from '@/validators/user.schemas';
import { FORBIDDEN, NOT_FOUND, OK } from '../constants/http';
import UserModel from '../models/user.model';
import appAssert from '../utils/appAssert';
import { catchErrors } from '../utils/asyncHandler';
import { getAllUsers, updateUserProfile } from '@/services/user.service';
import { parseFormData } from '@/utils/parseFormData';
import { Role } from '@/types';

// GET /users/:courseId - Get all users for a specific course
export const getUserForCourseHandler = catchErrors(async (req, res) => {
  const request = listAllUsersSchema.parse(parseFormData(req.query));
  const role = req.role;

  const { data, pagination } = await getAllUsers(request, role);

  return res.success(OK, {
    data,
    message: 'Users retrieved successfully',
    pagination,
  });
});

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req?.userId);
  appAssert(user, NOT_FOUND, 'User not found');

  return res.status(OK).json(user.omitPassword());
});

// PUT /users/:userId - Update user profile
export const updateUserProfileHandler = catchErrors(async (req, res) => {
  appAssert(
    req.role === Role.ADMIN || req.userId?.toString() === req.params.userId,
    FORBIDDEN,
    'You can only update your own profile'
  );

  const avatar = req.file;
  const input = updateUserProfileSchema.parse(
    parseFormData({
      userId: req.params.userId,
      avatar,
      ...req.body,
    })
  );
  const userRole = req.role;

  const data = await updateUserProfile(input, userRole);

  return res.success(OK, {
    data,
    message: 'Update user profile successfully',
  });
});
