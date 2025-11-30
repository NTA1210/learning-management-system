import { CREATED, OK } from '@/constants/http';
import { createChatroom, getChatRooms } from '@/services/chatRoom.service';
import { catchErrors } from '@/utils/asyncHandler';
import { createChatroomSchema } from '@/validators/chatroom.schemas';

// GET /chat-rooms
export const getChatRoomsHandler = catchErrors(async (req, res) => {
  const userId = req.userId;

  const data = await getChatRooms(userId);

  return res.success(OK, {
    data,
    message: 'Chat rooms retrieved successfully',
  });
});

// POST /chat-rooms
export const createChatroomHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const role = req.role;
  const params = createChatroomSchema.parse(req.body);

  const data = await createChatroom(params, userId, role);

  return res.success(CREATED, {
    data,
    message: 'Chat room created successfully',
  });
});
