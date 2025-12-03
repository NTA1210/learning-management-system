import { Server, Socket } from 'socket.io';
import { ChatRoomModel, MessageModel } from '@/models';
import mongoose from 'mongoose';

// Store active calls: callId -> Set of participant userIds
const activeCalls = new Map<string, Set<string>>();

// Store user's current call: userId -> callId
const userCalls = new Map<string, string>();

// Store chatRoom's active call: chatRoomId -> callId
const chatRoomCalls = new Map<string, string>();

// Store call's chatRoomId: callId -> chatRoomId
const callChatRooms = new Map<string, string>();

// Helper function to send video call notification message
const sendVideoCallNotification = async (
  io: Server,
  chatRoomId: string,
  userId: string,
  username: string,
  userRole: string,
  avatarUrl: string | undefined,
  content: string
) => {
  try {
    const chatRoom = await ChatRoomModel.findById(chatRoomId);
    if (!chatRoom) return;

    // Create system message
    const message = await MessageModel.create({
      chatRoomId,
      senderId: userId,
      content,
      senderRole: userRole,
      isNotification: true,
    });

    // Update chat room last message
    chatRoom.lastMessage = {
      id: message.id,
      senderId: new mongoose.Types.ObjectId(userId),
      content,
      isNotification: true,
      timestamp: new Date(),
    };

    await chatRoom.save();

    const messageData = {
      _id: message.id,
      senderId: {
        _id: userId,
        username,
        role: userRole,
        avatar_url: avatarUrl,
      },
      content,
      isNotification: true,
      createdAt: message.createdAt,
    };

    // Emit to chat room
    io.to(chatRoomId).emit('chatroom:new-message', {
      chatRoomId,
      message: messageData,
    });

    io.to(chatRoomId).emit('chatroom:update-chatroom', {
      chatRoomId,
      lastMessage: chatRoom.lastMessage,
      unreadCounts: chatRoom.unreadCounts,
    });
  } catch (error) {
    console.error('[VideoCall] Error sending notification:', error);
  }
};

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
    chatRoomCalls.set(chatRoomId, callId);
    callChatRooms.set(callId, chatRoomId);

    // Join a dedicated room for this call
    socket.join(callId);

    console.log(`[VideoCall] User ${userId} started call ${callId} in chatRoom ${chatRoomId}`);

    // Send notification message to chat room
    await sendVideoCallNotification(
      io,
      chatRoomId,
      userId,
      user.username,
      user.role,
      user.avatar_url,
      `📹 ${user.username} started a video call`
    );

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

    // Send notification message to chat room
    const actualChatRoomId = chatRoomId || callChatRooms.get(callId);
    if (actualChatRoomId) {
      await sendVideoCallNotification(
        io,
        actualChatRoomId,
        userId,
        user.username,
        user.role,
        user.avatar_url,
        `📞 ${user.username} joined the video call`
      );
    }

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

    await handleUserLeaveCall(io, socket, userId, callId);
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

    console.log(`[VideoCall] Relaying ICE candidate from ${userId} to ${toUserId}`, {
      type: candidate?.type,
      protocol: candidate?.protocol,
    });

    // Send ICE candidate to specific user (user joins room with their ID)
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
    const user = socket.user;

    if (!userId) return;

    const call = activeCalls.get(callId);
    if (!call) return;

    const chatRoomId = callChatRooms.get(callId);

    console.log(`[VideoCall] User ${userId} ending call ${callId}`);

    // Send notification message to chat room
    if (chatRoomId && user) {
      await sendVideoCallNotification(
        io,
        chatRoomId,
        userId,
        user.username,
        user.role,
        user.avatar_url,
        `📵 ${user.username} ended the video call`
      );
    }

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
    
    // Remove from chatRoom tracking
    for (const [crId, cId] of chatRoomCalls.entries()) {
      if (cId === callId) {
        chatRoomCalls.delete(crId);
        break;
      }
    }
    callChatRooms.delete(callId);
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
const handleUserLeaveCall = async (io: Server, socket: Socket, userId: string, callId?: string) => {
  const actualCallId = callId || userCalls.get(userId);
  if (!actualCallId) return;

  const call = activeCalls.get(actualCallId);
  if (!call) return;

  const user = socket.user;
  const chatRoomId = callChatRooms.get(actualCallId);

  // Remove user from call
  call.delete(userId);
  userCalls.delete(userId);

  // Leave the call room
  socket.leave(actualCallId);

  console.log(`[VideoCall] User ${userId} left call ${actualCallId}`);

  // Send notification message to chat room
  if (chatRoomId && user) {
    await sendVideoCallNotification(
      io,
      chatRoomId,
      userId,
      user.username,
      user.role,
      user.avatar_url,
      `📴 ${user.username} left the video call`
    );
  }

  // Notify other participants
  socket.to(actualCallId).emit('videocall:peer-left', {
    callId: actualCallId,
    peerId: userId,
  });

  // If no participants left, clean up the call and send ended notification
  if (call.size === 0) {
    activeCalls.delete(actualCallId);
    
    // Send call ended notification
    if (chatRoomId && user) {
      await sendVideoCallNotification(
        io,
        chatRoomId,
        userId,
        user.username,
        user.role,
        user.avatar_url,
        `📵 Video call ended`
      );
    }
    
    // Remove from chatRoom tracking
    for (const [crId, cId] of chatRoomCalls.entries()) {
      if (cId === actualCallId) {
        chatRoomCalls.delete(crId);
        break;
      }
    }
    callChatRooms.delete(actualCallId);
    
    console.log(`[VideoCall] Call ${actualCallId} ended - no participants left`);
  }
};

// Get active call for a chat room
export const getActiveCall = async (io: Server, socket: Socket, data: any) => {
  try {
    const { chatRoomId } = data;
    const userId = socket.userId?.toString();

    if (!userId) return;

    const callId = chatRoomCalls.get(chatRoomId);
    const call = callId ? activeCalls.get(callId) : null;

    if (callId && call && call.size > 0) {
      // Get participant info
      const participants = Array.from(call);
      
      socket.emit('videocall:active-call-info', {
        hasActiveCall: true,
        callId,
        chatRoomId,
        participantCount: call.size,
        participants,
      });
    } else {
      socket.emit('videocall:active-call-info', {
        hasActiveCall: false,
        chatRoomId,
      });
    }
  } catch (error) {
    console.error('[VideoCall] Error in getActiveCall:', error);
  }
};

// Handle disconnection
export const handleVideoCallDisconnect = async (io: Server, socket: Socket) => {
  const userId = socket.userId?.toString();
  if (!userId) return;

  const callId = userCalls.get(userId);
  if (callId) {
    await handleUserLeaveCall(io, socket, userId, callId);
  }
};
