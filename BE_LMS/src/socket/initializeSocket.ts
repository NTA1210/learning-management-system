import { type Server, Socket } from 'socket.io';
import SocketEvents from './socketEvents';
import {
  chatRoomInviteUser,
  chatRoomSendFile,
  chatRoomSendMessage,
  conversationMarkAsRead,
  conversationTyping,
} from './socketConversation';
import { getChatRoom } from './helpers';

const initializeSocket = async (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    try {
      const user = socket.user;
      if (!user) return;
      console.log('User connected', user.id);
      socket.join(user.id);

      const chatRooms = await getChatRoom(user.id);
      chatRooms.forEach((chatRoom) => {
        socket.join(chatRoom.id);
      });

      socket.on(SocketEvents.CHATROOM_SEND_MESSAGE, (data) => {
        chatRoomSendMessage(io, socket, data);
      });

      socket.on('conversation:typing', (data) => {
        conversationTyping(io, socket, data);
      });

      socket.on('chatroom:mark-as-read', (data) => {
        conversationMarkAsRead(io, socket, data);
      });

      socket.on('chatroom:send-file', (data) => {
        chatRoomSendFile(io, socket, data);
      });

      socket.on('chatroom:invite-user', (data) => {
        chatRoomInviteUser(io, socket, data);
      });
    } catch (error) {
      console.error('Error in initializeSocket:', error);
      socket.emit(SocketEvents.INTERNAL_ERROR, 'Internal server error');
    }
  });
};

export default initializeSocket;
