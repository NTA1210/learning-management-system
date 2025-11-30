import { createChatroomHandler, getChatRoomsHandler } from '@/controller/chatRoom.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';
import { Router } from 'express';

//prefix: /chat-rooms
const chatRoomRoutes = Router();

chatRoomRoutes.get('/', getChatRoomsHandler);
chatRoomRoutes.post('/', authorize(Role.ADMIN, Role.TEACHER), createChatroomHandler);

export default chatRoomRoutes;
