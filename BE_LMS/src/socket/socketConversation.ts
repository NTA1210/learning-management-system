import { Server, Socket } from 'socket.io';
import SocketEvents from './socketEvents';
import { ChatRoomModel, MessageModel } from '@/models';
import { uploadFile } from '@/utils/uploadFile';
import { prefixChatRoomFile } from '@/utils/filePrefix';

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

    const message = await MessageModel.create({
      chatRoomId,
      senderId,
      content,
      senderRole,
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
      createdAt: message.createdAt,
    };

    console.log(chatRoom.unreadCounts.entries());

    for (const [userId, count] of chatRoom.unreadCounts.entries()) {
      if (userId !== senderId.toString()) {
        chatRoom.unreadCounts.set(userId, count + 1);
      } else {
        chatRoom.unreadCounts.set(userId, 0);
      }
    }

    console.log(chatRoom.unreadCounts);

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

    console.log('UPDATE MESSAGE');
  } catch (error) {
    console.error('Error in chatRoomSendMessage:', error);
    socket.emit('chatroom:send-message:error', 'Internal server error');
  }
};

export const conversationTyping = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId, isTyping } = data;
    const userId = socket.userId;

    io.to(chatRoomId).emit('conversation:update-typing', {
      userId,
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
