const enum SocketEvents {
  INTERNAL_ERROR = 'internal-error',
  CHATROOM_SEND_MESSAGE = 'chatroom:send-message',
  CHATROOM_SEND_MESSAGE_ERROR = 'chatroom:send-message:error',
  CHATROOM_NEW_MESSAGE = 'chatroom:new-message',
  CHATROOM_UPDATE_CHATROOM = 'chatroom:update-chatroom',

  // Video Call Events
  VIDEOCALL_START = 'videocall:start',
  VIDEOCALL_JOIN = 'videocall:join',
  VIDEOCALL_LEAVE = 'videocall:leave',
  VIDEOCALL_OFFER = 'videocall:offer',
  VIDEOCALL_ANSWER = 'videocall:answer',
  VIDEOCALL_ICE_CANDIDATE = 'videocall:ice-candidate',
  VIDEOCALL_TOGGLE_AUDIO = 'videocall:toggle-audio',
  VIDEOCALL_TOGGLE_VIDEO = 'videocall:toggle-video',
  VIDEOCALL_END = 'videocall:end',
  VIDEOCALL_REJECT = 'videocall:reject',
}

export default SocketEvents;
