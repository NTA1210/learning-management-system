import { NOT_FOUND } from '@/constants/http';
import { ChatRoomModel, CourseModel, UserModel } from '@/models';
import { Role } from '@/types';
import appAssert from '@/utils/appAssert';
import { CreateChatroomParams } from '@/validators/chatroom.schemas';
import mongoose from 'mongoose';

export const getChatRooms = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId);

  const chatRooms = await ChatRoomModel.find({
    'participants.userId': userId,
  }).populate([
    {
      path: 'courseId',
      select: 'title subjectId startDate endDate logo semesterId',
    },
    {
      path: 'lastMessage.senderId',
      select: 'username fullname email avatar_url',
    },
  ]);

  return [
    ...chatRooms.map((chatRoom) => {
      const { _id, courseId, name, participants, lastMessage, unreadCounts } = chatRoom;
      return {
        chatRoomId: _id,
        name,
        course: courseId,
        participants,
        lastMessage,
        unreadCounts: unreadCounts,
      };
    }),
  ];
};

export const createChatroom = async (
  params: CreateChatroomParams,
  userId: mongoose.Types.ObjectId,
  role: string
) => {
  const { courseId, name } = params;

  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');

  const chatroom = await ChatRoomModel.findOne({
    courseId,
    name,
  });

  appAssert(!chatroom, NOT_FOUND, 'Chat room already exists');

  if (role === Role.TEACHER) {
    const isTeacherOfCourse = course.teacherIds.some((id) => id.equals(userId));
    appAssert(isTeacherOfCourse, NOT_FOUND, 'You are not a teacher of this course');
  }

  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'User not found');

  const chatRoom = await ChatRoomModel.create({
    courseId,
    name,
    participants: [
      {
        userId,
        role,
        avatarUrl: user.avatar_url,
        joinedAt: new Date(),
      },
    ],
    lastMessage: {
      id: new mongoose.Types.ObjectId(),
      senderId: userId,
      content: `${user.username} has created the chat room`,
      createdAt: new Date(),
    },
    unreadCounts: {
      [userId.toString()]: 0,
    },
  });
  return chatRoom;
};
