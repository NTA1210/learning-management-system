import { getMessagesHandler } from '@/controller/message.controller';
import { authenticate } from '@/middleware';
import { Router } from 'express';

//prefix: /chat-rooms
const messageRoutes = Router();

messageRoutes.get('/:chatRoomId/messages', authenticate, getMessagesHandler);

export default messageRoutes;
