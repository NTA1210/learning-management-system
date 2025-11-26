import { getChatRoomsHandler } from '@/controller/chatRoom.controller';
import { Router } from 'express';

//prefix: /chat-rooms
const chatRoomRoutes = Router();

chatRoomRoutes.get('/', getChatRoomsHandler);

export default chatRoomRoutes;
