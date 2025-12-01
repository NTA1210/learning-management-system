import mongoose from 'mongoose';
import ChatRoomModel from '../models/chatRoom.model';
import MessageModel from '../models/message.model';
import { Role } from '../types';
import { UserModel } from '@/models';
import { MONGO_URI } from '@/constants/env';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Xóa hết data cũ
    await ChatRoomModel.deleteMany({});
    await MessageModel.deleteMany({});
    console.log('Cleared ChatRoom and Message collections');

    // Lấy users
    const student = await UserModel.findById('690ca6e13f693bc2ef752c5f');
    const teacher = await UserModel.findById('690ca6e13f693bc2ef752c5e');

    if (!student || !teacher) {
      console.error('Student or Teacher not found');
      return;
    }

    // Tạo message đầu tiên
    const message = await MessageModel.create({
      chatRoomId: new mongoose.Types.ObjectId(), // sẽ gán đúng sau
      senderId: teacher._id,
      senderRole: Role.TEACHER,
      content: 'Welcome to the course chat room!',
    });

    // Tạo chat room
    const chatRoom = await ChatRoomModel.create({
      courseId: new mongoose.Types.ObjectId('690ca6e33f693bc2ef752caa'),
      name: 'Course Chat Room',
      participants: [
        {
          userId: student._id,
          username: student.username,
          role: student.role,
          avatarUrl: student.avatar_url || '', // nếu chưa có avatar, thêm ''
          joinedAt: new Date(),
        },
        {
          userId: teacher._id,
          username: teacher.username,
          role: teacher.role,
          avatarUrl: teacher.avatar_url || '',
          joinedAt: new Date(),
        },
      ],
      createdBy: teacher._id,
      lastMessage: {
        id: message._id,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.createdAt!,
      },
      seenBy: [teacher._id],
      unreadCounts: {
        [student._id.toString()]: 1,
      },
    });

    // Cập nhật chatRoomId cho message
    message.chatRoomId = new mongoose.Types.ObjectId('690ca6e33f693bc2ef752caa');
    await message.save();

    console.log('Chat room and initial message created successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
