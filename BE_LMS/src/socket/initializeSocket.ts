import { type Server, Socket } from 'socket.io';
import SocketEvents from './socketEvents';

const initializeSocket = async (io: Server) => {
  io.on('connection', (socket: Socket) => {
    try {
      const user = socket.user;
      if (!user) return;
      console.log('User connected', user.id);
      socket.join(user.id);
    } catch (error) {
      console.error('Error in initializeSocket:', error);
      socket.emit(SocketEvents.INTERNAL_ERROR, 'Internal server error');
    }
  });
};

export default initializeSocket;
