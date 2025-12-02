import { type Server, Socket } from 'socket.io';
import SocketEvents from './socketEvents';
import {
  chatRoomInviteUser,
  chatRoomSendFile,
  chatRoomSendMessage,
  conversationMarkAsRead,
  conversationTyping,
  joinNewChatroom,
  leaveChatRoom,
} from './socketConversation';
import {
  handleVideoCallDisconnect,
  videoCallAnswer,
  videoCallEnd,
  videoCallIceCandidate,
  videoCallJoin,
  videoCallLeave,
  videoCallOffer,
  videoCallReject,
  videoCallStart,
  videoCallToggleAudio,
  videoCallToggleVideo,
} from './socketVideoCall';
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

      socket.on('chatroom:leave-chatroom', (data) => {
        leaveChatRoom(io, socket, data);
      });

      socket.on('chatroom:join', (data) => {
        joinNewChatroom(io, socket, data);
      });

      // Video Call Events
      socket.on(SocketEvents.VIDEOCALL_START, (data) => {
        videoCallStart(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_JOIN, (data) => {
        videoCallJoin(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_LEAVE, (data) => {
        videoCallLeave(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_OFFER, (data) => {
        videoCallOffer(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_ANSWER, (data) => {
        videoCallAnswer(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_ICE_CANDIDATE, (data) => {
        videoCallIceCandidate(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_TOGGLE_AUDIO, (data) => {
        videoCallToggleAudio(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_TOGGLE_VIDEO, (data) => {
        videoCallToggleVideo(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_END, (data) => {
        videoCallEnd(io, socket, data);
      });

      socket.on(SocketEvents.VIDEOCALL_REJECT, (data) => {
        videoCallReject(io, socket, data);
      });

      // Handle disconnect for video calls
      socket.on('disconnect', () => {
        handleVideoCallDisconnect(io, socket);
        console.log('User disconnected', user.id);
      });
    } catch (error) {
      console.error('Error in initializeSocket:', error);
      socket.emit(SocketEvents.INTERNAL_ERROR, 'Internal server error');
    }
  });
};

export default initializeSocket;
