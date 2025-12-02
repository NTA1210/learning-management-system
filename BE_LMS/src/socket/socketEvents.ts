const enum SocketEvents {
  INTERNAL_ERROR = 'internal-error',
  CHATROOM_SEND_MESSAGE = 'chatroom:send-message',
  CHATROOM_SEND_MESSAGE_ERROR = 'chatroom:send-message:error',
  CHATROOM_NEW_MESSAGE = 'chatroom:new-message',
  CHATROOM_UPDATE_CHATROOM = 'chatroom:update-chatroom',
}

export default SocketEvents;
