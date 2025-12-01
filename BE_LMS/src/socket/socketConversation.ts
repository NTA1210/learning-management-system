import { Server, Socket } from 'socket.io';
import SocketEvents from './socketEvents';
import { ChatRoomModel, MessageModel, NotificationModel, UserModel } from '@/models';
import { uploadFile } from '@/utils/uploadFile';
import { prefixChatRoomFile } from '@/utils/filePrefix';
import mongoose from 'mongoose';
import { Role } from '@/types';

const urlRegex = /(https?:\/\/[^\s]+)/g;

export const chatRoomSendMessage = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId, userId: senderId, senderRole, content } = data;
    const user = socket.user;
    const userId = socket.userId;

    if (!user || !userId) return;

    const chatRoom = await ChatRoomModel.findById(chatRoomId);

    if (!chatRoom) {
      socket.emit(SocketEvents.CHATROOM_SEND_MESSAGE_ERROR, 'Chat room not found');
      return;
    }

    const isLink = urlRegex.test(content);

    const message = await MessageModel.create({
      chatRoomId,
      senderId,
      content,
      senderRole,
      isLink,
    });

    const messageData = {
      _id: message.id,
      senderId: {
        _id: userId,
        username: user.username,
        role: senderRole,
        avatar_url: user.avatar_url,
      },
      content,
      isLink,
      createdAt: message.createdAt,
    };

    for (const [userId, count] of chatRoom.unreadCounts.entries()) {
      if (userId !== senderId.toString()) {
        chatRoom.unreadCounts.set(userId, count + 1);
      } else {
        chatRoom.unreadCounts.set(userId, 0);
      }
    }

    chatRoom.lastMessage = {
      id: message.id,
      senderId,
      content,
      timestamp: message.createdAt,
    };

    await chatRoom.save();

    const room = chatRoom.id.toString();
    io.to(room).emit('chatroom:new-message', {
      chatRoomId,
      message: messageData,
    });

    socket.to(room).emit('chatroom:notification-new-message', {
      chatRoomName: chatRoom.name,
      chatRoomId,
      message: messageData,
    });

    io.to(room).emit('chatroom:update-chatroom', {
      chatRoomId,
      lastMessage: {
        id: message.id,
        senderId: {
          _id: userId,
          username: user.username,
          role: senderRole,
          avatar_url: user.avatar_url,
        },
        content,
        timestamp: message.createdAt,
      },
      unreadCounts: chatRoom.unreadCounts,
    });
  } catch (error) {
    console.error('Error in chatRoomSendMessage:', error);
    socket.emit('chatroom:send-message:error', 'Internal server error');
  }
};

export const conversationTyping = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId, isTyping } = data;
    const userId = socket.userId;

    if (!userId) return;

    const chat = await ChatRoomModel.findById(chatRoomId);

    io.to(chatRoomId).emit('conversation:update-typing', {
      chatRoomId: chatRoomId.toString(),
      userId: userId.toString(),
      isTyping,
    });
  } catch (error) {
    console.error('Error in conversationTyping:', error);
  }
};

export const conversationMarkAsRead = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId } = data;
    const userId = socket.userId;

    if (!userId) return;

    const chatRoom = await ChatRoomModel.findById(chatRoomId);

    if (!chatRoom) {
      socket.emit('chatroom:mark-as-read:error', 'Chat room not found');
      return;
    }

    chatRoom.unreadCounts.set(userId, 0);
    await chatRoom.save();

    io.to(chatRoomId).emit('chatroom:update-unread-counts', {
      chatRoomId,
      unreadCounts: chatRoom.unreadCounts,
    });
  } catch (error) {
    console.error('Error in conversationTyping:', error);
    socket.emit('chatroom:mark-as-read:error', 'Internal server error');
  }
};

export const chatRoomSendFile = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId, userId: senderId, senderRole, fileName, mimeType, data: bufferData } = data;
    const user = socket.user;
    const userId = socket.userId;

    if (!user || !userId) return;

    const chatRoom = await ChatRoomModel.findById(chatRoomId);

    if (!chatRoom) {
      socket.emit('chatroom:send-message:error', 'Chat room not found');
      return;
    }

    const file = {
      originalname: fileName,
      buffer: Buffer.from(new Uint8Array(bufferData)),
      size: bufferData.byteLength,
    } as Express.Multer.File;

    const {
      publicUrl,
      key,
      originalName,
      mimeType: fileMimeType,
      size,
    } = await uploadFile(file, prefixChatRoomFile(chatRoom.courseId.toString(), chatRoomId));

    const message = await MessageModel.create({
      chatRoomId,
      senderId,
      senderRole,
      file: {
        url: publicUrl,
        key,
        mimeType: fileMimeType,
        originalName: originalName,
        size,
      },
    });

    chatRoom.lastMessage = {
      id: message.id,
      senderId,
      content: 'sent a file',
      timestamp: message.createdAt,
    };

    await chatRoom.save();

    const messageData = {
      _id: message.id,
      senderId: {
        _id: userId,
        username: user.username,
        role: senderRole,
        avatarUrl: user.avatar_url,
      },
      file: {
        url: publicUrl,
        key,
        mimeType: fileMimeType,
        originalName: originalName,
        size,
      },
      createdAt: message.createdAt,
    };

    const room = chatRoom.id.toString();
    io.to(room).emit('chatroom:new-message', {
      chatRoomId,
      message: messageData,
    });

    io.to(room).emit('chatroom:update-chatroom', {
      chatRoomId,
      lastMessage: {
        id: message.id,
        senderId: {
          _id: userId,
          username: user.username,
          role: senderRole,
          avatar_url: user.avatar_url,
        },
        content: 'sent a file',
        timestamp: message.createdAt,
      },
      unreadCounts: chatRoom.unreadCounts,
    });
  } catch (error) {
    console.error('Error in chatRoomSendFile:', error);
    socket.emit('chatroom:send-message:error', 'Internal server error');
  }
};

export const chatRoomInviteUser = async (io: Server, socket: Socket, data: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chatRoomId, email } = data;
    const userId = socket.userId;
    const user = socket.user;

    if (!userId || !user) return;

    const chatRoom = await ChatRoomModel.findById(chatRoomId).populate('courseId').session(session);

    if (!chatRoom) throw new Error('Chat room not found');

    const exist = await UserModel.findOne({ email }).session(session);
    if (!exist) throw new Error('User not found');

    if (user.role === Role.STUDENT) throw new Error('Unauthorized, user is a student');

    if (chatRoom.participants.some((p) => p.userId.toString() === exist.id.toString()))
      throw new Error('User already in chat room');

    // ---------------------------
    // 1) UPDATE CHAT ROOM (atomic)
    // ---------------------------
    chatRoom.participants.push({
      userId: exist.id,
      role: exist.role,
      username: exist.username,
      avatarUrl: exist.avatar_url,
      joinedAt: new Date(),
    });

    for (const [uid, count] of chatRoom.unreadCounts.entries()) {
      if (uid !== user.id.toString()) {
        chatRoom.unreadCounts.set(uid, count + 1);
      } else {
        chatRoom.unreadCounts.set(uid, 0);
      }
    }

    chatRoom.lastMessage = {
      id: new mongoose.Types.ObjectId(),
      senderId: userId,
      content: `${exist.username} joined the chat room`,
      isNotification: true,
      timestamp: new Date(),
    };

    await chatRoom.save({ session });

    // ---------------------------
    // 2) CREATE NOTIFICATION
    // ---------------------------
    await NotificationModel.create(
      [
        {
          title: 'You have been invited to a chat room',
          message: `${user.username} invited you to a chat room`,
          recipientUser: exist.id,
          sender: user.id,
          recipientType: 'user',
        },
      ],
      { session }
    );

    // ---------------------------
    // 3) CREATE SYSTEM MESSAGE
    // ---------------------------
    await MessageModel.create(
      [
        {
          chatRoomId,
          senderId: userId,
          content: `${exist.username} joined the chat room`,
          isNotification: true,
        },
      ],
      { session }
    );

    // ---------------------------
    // 4) COMMIT (mọi thứ ok)
    // ---------------------------
    await session.commitTransaction();
    session.endSession();

    // ----> Emit socket sau commit <----
    const room = chatRoom.id.toString();

    const messageData = {
      _id: new mongoose.Types.ObjectId(),
      senderId: {
        _id: userId,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      content: `${exist.username} joined the chat room`,
      isNotification: true,
      timestamp: new Date(),
    };

    io.to(room).emit('chatroom:new-message', {
      chatRoomId,
      message: messageData,
    });

    socket.to(room).emit('chatroom:notification-new-message', {
      chatRoomId,
      chatRoomName: chatRoom.name,
      message: messageData,
    });

    io.to(room).emit('chatroom:update-chatroom', {
      chatRoomId,
      lastMessage: chatRoom.lastMessage,
      unreadCounts: chatRoom.unreadCounts,
    });

    io.to(exist._id.toString()).emit('chatroom:added', {
      chatRoomId: chatRoom.id.toString(),
      name: chatRoom.name,
      course: chatRoom.courseId,
      participants: chatRoom.participants,
      unreadCounts: chatRoom.unreadCounts,
      lastMessage: chatRoom.lastMessage,
    });
  } catch (error: any) {
    // ❗ROLLBACK — tất cả thay đổi bị hủy
    await session.abortTransaction();
    session.endSession();

    console.error('Invite error:', error);
    socket.emit('chatroom:invite-user:error', error.message || 'Something went wrong');
  }
};

export const leaveChatRoom = async (io: Server, socket: Socket, data: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chatRoomId } = data;
    const userId = socket.userId;
    const user = socket.user;

    if (!userId || !user) return;

    const chatRoom = await ChatRoomModel.findById(chatRoomId).populate('courseId').session(session);

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // Remove participant
    chatRoom.participants = chatRoom.participants.filter(
      (p) => p.userId.toString() !== userId.toString()
    );

    // Update unreadCounts
    for (const [uid, count] of chatRoom.unreadCounts.entries()) {
      if (uid !== user.id.toString()) {
        chatRoom.unreadCounts.set(uid, count + 1);
      } else {
        chatRoom.unreadCounts.set(uid, 0);
      }
    }

    chatRoom.lastMessage = {
      id: new mongoose.Types.ObjectId(),
      senderId: userId,
      content: `${user.username} left the chat room`,
      isNotification: true,
      timestamp: new Date(),
    };

    await chatRoom.save({ session });

    await MessageModel.create(
      [
        {
          chatRoomId,
          senderId: userId,
          content: `${user.username} left the chat room`,
          senderRole: user.role,
          isLink: false,
          isNotification: true,
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Emit events sau khi transaction thành công
    const messageData = {
      id: new mongoose.Types.ObjectId(),
      senderId: {
        _id: userId,
        username: user.username,
        role: user,
        avatar_url: user.avatar_url,
      },
      isNotification: true,
      content: `${user.username} left the chat room`,
      timestamp: new Date(),
    };

    const room = chatRoom.id.toString();

    socket.to(room).emit('chatroom:notification-new-message', {
      chatRoomName: chatRoom.name,
      chatRoomId,
      message: messageData,
    });

    socket.to(room).emit('chatroom:new-message', {
      chatRoomId,
      message: messageData,
    });

    socket.to(room).emit('chatroom:update-chatroom', {
      chatRoomId,
      lastMessage: chatRoom.lastMessage,
      unreadCounts: chatRoom.unreadCounts,
    });

    socket.emit('chatroom:leave-chatroom:success', {
      chatRoomId,
      course: chatRoom.courseId,
      lastMessage: chatRoom.lastMessage,
    });

    socket.leave(chatRoomId);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in leaveChatRoom:', error);
    socket.emit('chatroom:leave-chatroom:error', 'Internal server error');
  }
};

export const joinNewChatroom = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId } = data;

    socket.join(chatRoomId);
    return;
  } catch (error) {
    console.error('Error in joinNewChatroom:', error);
    socket.emit('chatroom:join-new-chatroom:error', 'Internal server error');
  }
};
