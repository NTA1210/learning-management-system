import { Server, Socket } from 'socket.io';

// Store active calls: callId -> Set of participant userIds
const activeCalls = new Map<string, Set<string>>();

// Store user's current call: odUserId -> callId
const userCalls = new Map<string, string>();

export const videoCallStart = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId, callType } = data;
    const userId = socket.userId?.toString();
    const user = socket.user;

    if (!userId || !user) return;

    const callId = `call_${chatRoomId}_${Date.now()}`;

    // Initialize the call
    activeCalls.set(callId, new Set([userId]));
    userCalls.set(userId, callId);

    // Join a dedicated room for this call
    socket.join(callId);

    console.log(`[VideoCall] User ${userId} started call ${callId} in chatRoom ${chatRoomId}`);

    // Notify the caller that call started successfully
    socket.emit('videocall:call-started', {
      callId,
      chatRoomId,
      callType,
    });

    // Notify other participants in the chatroom about incoming call
    socket.to(chatRoomId).emit('videocall:incoming-call', {
      callId,
      chatRoomId,
      callType,
      caller: {
        id: userId,
        username: user.username,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallStart:', error);
    socket.emit('videocall:error', { message: 'Failed to start call' });
  }
};

export const videoCallJoin = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, chatRoomId } = data;
    const userId = socket.userId?.toString();
    const user = socket.user;

    if (!userId || !user) return;

    const call = activeCalls.get(callId);
    if (!call) {
      socket.emit('videocall:error', { message: 'Call not found or ended' });
      return;
    }

    // Get existing participants before adding new one
    const existingParticipants = Array.from(call);

    // Add user to the call
    call.add(userId);
    userCalls.set(userId, callId);

    // Join the call room
    socket.join(callId);

    console.log(`[VideoCall] User ${userId} joined call ${callId}`);

    // Notify new participant about existing participants
    socket.emit('videocall:existing-participants', {
      callId,
      participants: existingParticipants,
    });

    // Notify all existing participants about the new peer
    socket.to(callId).emit('videocall:peer-joined', {
      callId,
      peerId: userId,
      peerInfo: {
        id: userId,
        username: user.username,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallJoin:', error);
    socket.emit('videocall:error', { message: 'Failed to join call' });
  }
};

export const videoCallLeave = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    handleUserLeaveCall(io, socket, userId, callId);
  } catch (error) {
    console.error('[VideoCall] Error in videoCallLeave:', error);
  }
};

export const videoCallOffer = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, toUserId, offer } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    console.log(`[VideoCall] Relaying offer from ${userId} to ${toUserId}`);

    // Send offer to specific user
    io.to(toUserId).emit('videocall:offer', {
      callId,
      fromUserId: userId,
      offer,
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallOffer:', error);
  }
};

export const videoCallAnswer = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, toUserId, answer } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    console.log(`[VideoCall] Relaying answer from ${userId} to ${toUserId}`);

    // Send answer to specific user
    io.to(toUserId).emit('videocall:answer', {
      callId,
      fromUserId: userId,
      answer,
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallAnswer:', error);
  }
};

export const videoCallIceCandidate = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, toUserId, candidate } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    console.log(`[VideoCall] Relaying ICE candidate from ${userId} to ${toUserId}`);

    // Send ICE candidate to specific user
    io.to(toUserId).emit('videocall:ice-candidate', {
      callId,
      fromUserId: userId,
      candidate,
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallIceCandidate:', error);
  }
};

export const videoCallToggleAudio = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, isMuted } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    // Notify all participants about audio state change
    socket.to(callId).emit('videocall:participant-audio-toggle', {
      participantId: userId,
      isMuted,
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallToggleAudio:', error);
  }
};

export const videoCallToggleVideo = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, isVideoOff } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    // Notify all participants about video state change
    socket.to(callId).emit('videocall:participant-video-toggle', {
      participantId: userId,
      isVideoOff,
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallToggleVideo:', error);
  }
};

export const videoCallEnd = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    const call = activeCalls.get(callId);
    if (!call) return;

    console.log(`[VideoCall] User ${userId} ending call ${callId}`);

    // Notify all participants that call has ended
    io.to(callId).emit('videocall:call-ended', {
      callId,
      endedBy: userId,
    });

    // Clean up all users from this call
    call.forEach((participantId) => {
      userCalls.delete(participantId);
    });

    // Remove the call
    activeCalls.delete(callId);
  } catch (error) {
    console.error('[VideoCall] Error in videoCallEnd:', error);
  }
};

export const videoCallReject = async (io: Server, socket: Socket, data: any) => {
  try {
    const { callId, callerId } = data;
    const userId = socket.userId?.toString();
    const user = socket.user;

    if (!userId || !user) return;

    console.log(`[VideoCall] User ${userId} rejected call ${callId}`);

    // Notify the caller that call was rejected
    io.to(callerId).emit('videocall:call-rejected', {
      callId,
      rejectedBy: {
        id: userId,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('[VideoCall] Error in videoCallReject:', error);
  }
};

// Helper function to handle user leaving a call
const handleUserLeaveCall = (io: Server, socket: Socket, userId: string, callId?: string) => {
  const actualCallId = callId || userCalls.get(userId);
  if (!actualCallId) return;

  const call = activeCalls.get(actualCallId);
  if (!call) return;

  // Remove user from call
  call.delete(userId);
  userCalls.delete(userId);

  // Leave the call room
  socket.leave(actualCallId);

  console.log(`[VideoCall] User ${userId} left call ${actualCallId}`);

  // Notify other participants
  socket.to(actualCallId).emit('videocall:peer-left', {
    callId: actualCallId,
    peerId: userId,
  });

  // If no participants left, clean up the call
  if (call.size === 0) {
    activeCalls.delete(actualCallId);
    console.log(`[VideoCall] Call ${actualCallId} ended - no participants left`);
  }
};

// Handle disconnection
export const handleVideoCallDisconnect = (io: Server, socket: Socket) => {
  const userId = socket.userId?.toString();
  if (!userId) return;

  const callId = userCalls.get(userId);
  if (callId) {
    handleUserLeaveCall(io, socket, userId, callId);
  }
};
