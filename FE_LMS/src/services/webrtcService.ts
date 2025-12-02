import { Socket } from "socket.io-client";

// STUN/TURN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

export interface PeerConnection {
  oderId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

type WebRTCEventHandler = {
  onRemoteStream: (userId: string, stream: MediaStream) => void;
  onPeerDisconnected: (userId: string) => void;
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
};

class WebRTCService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private eventHandlers: WebRTCEventHandler | null = null;
  private currentCallId: string | null = null;
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  initialize(socket: Socket, _userId: string, handlers: WebRTCEventHandler) {
    this.socket = socket;
    this.eventHandlers = handlers;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Handle incoming WebRTC offer
    this.socket.on("videocall:offer", async (data: {
      callId: string;
      fromUserId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log("[WebRTC] Received offer from:", data.fromUserId);
      await this.handleOffer(data.fromUserId, data.offer, data.callId);
    });

    // Handle incoming WebRTC answer
    this.socket.on("videocall:answer", async (data: {
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log("[WebRTC] Received answer from:", data.fromUserId);
      await this.handleAnswer(data.fromUserId, data.answer);
    });

    // Handle incoming ICE candidate
    this.socket.on("videocall:ice-candidate", async (data: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      console.log("[WebRTC] Received ICE candidate from:", data.fromUserId);
      await this.handleIceCandidate(data.fromUserId, data.candidate);
    });

    // Note: videocall:peer-joined is handled in VideoCallContainer to properly add participant first

    // Handle peer left the call
    this.socket.on("videocall:peer-left", (data: {
      peerId: string;
    }) => {
      console.log("[WebRTC] Peer left:", data.peerId);
      this.closePeerConnection(data.peerId);
      this.eventHandlers?.onPeerDisconnected(data.peerId);
    });
  }

  async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle when user stops screen sharing via browser UI
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Restore camera video track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  private createPeerConnection(userId: string): RTCPeerConnection {
    console.log("[WebRTC] Creating peer connection for:", userId);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    if (this.localStream) {
      console.log("[WebRTC] Adding local tracks:", this.localStream.getTracks());
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    } else {
      console.warn("[WebRTC] No local stream when creating peer connection!");
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit("videocall:ice-candidate", {
          callId: this.currentCallId,
          toUserId: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track from:", userId);
      console.log("[WebRTC] Track kind:", event.track.kind);
      console.log("[WebRTC] Track enabled:", event.track.enabled);
      console.log("[WebRTC] Streams:", event.streams);
      
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log("[WebRTC] Remote stream tracks:", remoteStream.getTracks());
        this.eventHandlers?.onRemoteStream(userId, remoteStream);
      } else {
        console.warn("[WebRTC] No remote stream in event");
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState);
      this.eventHandlers?.onConnectionStateChange(userId, pc.connectionState);
      
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        this.closePeerConnection(userId);
        this.eventHandlers?.onPeerDisconnected(userId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${userId}:`, pc.iceConnectionState);
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  async createOffer(userId: string, callId: string) {
    this.currentCallId = callId;
    
    // Check if connection already exists
    let pc = this.peerConnections.get(userId);
    if (pc) {
      console.log("[WebRTC] Connection already exists for", userId, "state:", pc.signalingState);
      // If already stable with remote description, skip (connection already established)
      if (pc.signalingState === "stable" && pc.remoteDescription) {
        console.log("[WebRTC] Connection already established, skipping offer");
        return;
      }
      // If in wrong state, close and recreate
      if (pc.signalingState !== "stable") {
        console.log("[WebRTC] Connection in wrong state, recreating");
        pc.close();
        this.peerConnections.delete(userId);
      }
    }
    
    pc = this.peerConnections.get(userId) || this.createPeerConnection(userId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      console.log("[WebRTC] Sending offer to:", userId);
      this.socket?.emit("videocall:offer", {
        callId,
        toUserId: userId,
        offer: pc.localDescription,
      });
    } catch (error) {
      console.error("[WebRTC] Error creating offer:", error);
      throw error;
    }
  }

  private async handleOffer(fromUserId: string, offer: RTCSessionDescriptionInit, callId: string) {
    this.currentCallId = callId;
    
    // Check if we already have a connection - if so, close it and create fresh
    let pc = this.peerConnections.get(fromUserId);
    if (pc) {
      console.log("[WebRTC] Already have connection for", fromUserId, "- checking state:", pc.signalingState);
      // If connection exists but is in wrong state, recreate it
      if (pc.signalingState !== "stable") {
        console.log("[WebRTC] Connection in wrong state, closing and recreating");
        pc.close();
        this.peerConnections.delete(fromUserId);
        pc = this.createPeerConnection(fromUserId);
      }
    } else {
      pc = this.createPeerConnection(fromUserId);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Apply any pending ICE candidates
      const pending = this.pendingCandidates.get(fromUserId);
      if (pending) {
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingCandidates.delete(fromUserId);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket?.emit("videocall:answer", {
        callId,
        toUserId: fromUserId,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  private async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      console.error("[WebRTC] No peer connection found for:", fromUserId);
      return;
    }

    // Only set remote description if we're in the right state
    if (pc.signalingState !== "have-local-offer") {
      console.warn(`[WebRTC] Ignoring answer - wrong state: ${pc.signalingState} (expected: have-local-offer)`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("[WebRTC] Successfully set remote answer from:", fromUserId);
      
      // Apply any pending ICE candidates
      const pending = this.pendingCandidates.get(fromUserId);
      if (pending) {
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingCandidates.delete(fromUserId);
      }
    } catch (error) {
      console.error("[WebRTC] Error handling answer:", error);
    }
  }

  private async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(fromUserId);
    
    if (!pc || !pc.remoteDescription) {
      // Store candidate for later if remote description not set yet
      if (!this.pendingCandidates.has(fromUserId)) {
        this.pendingCandidates.set(fromUserId, []);
      }
      this.pendingCandidates.get(fromUserId)!.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  private closePeerConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.pendingCandidates.delete(userId);
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Start a call
  startCall(callId: string, chatRoomId: string) {
    this.currentCallId = callId;
    this.socket?.emit("videocall:start", {
      callId,
      chatRoomId,
    });
  }

  // Join an existing call
  joinCall(callId: string) {
    this.currentCallId = callId;
    this.socket?.emit("videocall:join", {
      callId,
    });
  }

  // Leave the current call
  leaveCall(callId: string) {
    this.socket?.emit("videocall:leave", {
      callId,
    });
    this.cleanup();
  }

  // Decline an incoming call
  declineCall(callId: string) {
    this.socket?.emit("videocall:decline", {
      callId,
    });
  }

  // Clean up all connections and streams
  cleanup() {
    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.pendingCandidates.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop screen share
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    this.currentCallId = null;
  }

  // Get current local stream
  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  // Set local stream externally
  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
