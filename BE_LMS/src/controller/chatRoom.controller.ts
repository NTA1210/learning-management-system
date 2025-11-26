import { OK } from '@/constants/http';
import { getChatRooms } from '@/services/chatRoom.service';
import { catchErrors } from '@/utils/asyncHandler';

// GET /chat-rooms
export const getChatRoomsHandler = catchErrors(async (req, res) => {
  const userId = req.userId;

  const data = await getChatRooms(userId);

  return res.success(OK, {
    data,
    message: 'Chat rooms retrieved successfully',
  });
});
