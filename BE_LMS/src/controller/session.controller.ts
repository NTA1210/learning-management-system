import z from 'zod';
import { BAD_REQUEST, NOT_FOUND, OK } from '../constants/http';
import SessionModel from '../models/session.model';
import { catchErrors } from '../utils/asyncHandler';
import appAssert from '../utils/appAssert';
import { CourseModel, EnrollmentModel, UserModel } from '@/models';
import { Role } from '@/types';
import { CourseStatus } from '@/types/course.type';

export const getSessionHandler = catchErrors(async (req, res) => {
  const sessions = await SessionModel.find(
    {
      userId: req?.userId,
      expiresAt: { $gt: new Date() },
    },
    {
      _id: 1,
      userAgent: 1,
      createdAt: 1,
    },
    {
      sort: {
        createdAt: -1,
      },
    }
  );

  return res.success(
    OK,
    sessions.map((session) => ({
      ...session.toObject(),
      ...(session.id === req.sessionId && { isCurrent: true }),
    }))
  );
});

export const deleteSessionHandler = catchErrors(async (req, res) => {
  const sessionId = z.string().parse(req.params.id);
  const deletedSession = await SessionModel.findOneAndDelete({
    _id: sessionId,
    userId: req?.userId,
  });
  appAssert(deletedSession, NOT_FOUND, 'Session not found');

  return res.success(OK, {
    message: 'Session deleted successfully',
  });
});

export const deleteAllSessionOfUserHandler = catchErrors(async (req, res) => {
  const studentId = z.string().length(24, 'Invalid user id').parse(req.params.userId);

  const user = await UserModel.findById(studentId); // Kiểm tra xem user có tồn tại không
  appAssert(user, NOT_FOUND, 'User not found');

  const role = req.role;
  const userId = req.userId;
  if (role === Role.TEACHER) {
    appAssert(user.role === Role.STUDENT, BAD_REQUEST, 'You can only delete student sessions');

    const courseIsTeaching = await CourseModel.find({
      teacherIds: { $in: [userId] },
      status: CourseStatus.ONGOING,
    });

    const isStudentOfCourse = await EnrollmentModel.findOne({
      studentId,
      courseId: { $in: courseIsTeaching.map((course) => course.id) },
    });

    appAssert(
      isStudentOfCourse,
      BAD_REQUEST,
      'You can only delete student sessions of your courses'
    );
  }

  await SessionModel.deleteMany({ userId: studentId });
  return res.success(OK, {
    message: 'All sessions deleted successfully',
  });
});
