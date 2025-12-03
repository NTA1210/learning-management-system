import { Socket } from "socket.io-client";

// TURN server configuration - hardcoded for now (move to env vars for production)
const TURN_SERVER = "global.relay.metered.ca";
const TURN_USERNAME = "c83bd8ef115dd2a828773ff7";
const TURN_CREDENTIAL = "0mKaV0/zYTRHcT0e";

// STUN/TURN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Metered STUN server
    { urls: "stun:stun.relay.metered.ca:80" },
    
    // Google STUN as fallback
    { urls: "stun:stun.l.google.com:19302" },
    
    // TURN servers from Metered.ca (required for NAT traversal)
    {
      urls: "turn:global.relay.metered.ca:80",
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all",
};

console.log("[WebRTC] ICE servers configured:", ICE_SERVERS.iceServers?.length, "servers");

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
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;

  initialize(socket: Socket, userId: string, handlers: WebRTCEventHandler) {
    // Prevent duplicate initialization
    if (this.isInitialized && this.socket === socket) {
      console.log("[WebRTC] Already initialized with same socket, updating handlers only");
      this.eventHandlers = handlers;
      return;
    }

    // Clean up old listeners if re-initializing with different socket
    if (this.socket && this.socket !== socket) {
      this.removeSocketListeners();
    }

    this.socket = socket;
    this.currentUserId = userId;
    this.eventHandlers = handlers;
    this.setupSocketListeners();
    this.isInitialized = true;
    console.log("[WebRTC] Initialized for user:", userId);
  }

  private removeSocketListeners() {
    if (!this.socket) return;
    this.socket.off("videocall:offer");
    this.socket.off("videocall:answer");
    this.socket.off("videocall:ice-candidate");
    this.socket.off("videocall:peer-left");
    console.log("[WebRTC] Removed old socket listeners");
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Remove any existing listeners first
    this.removeSocketListeners();

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
      console.log(`[WebRTC] Received ICE candidate from ${data.fromUserId}`);
      await this.handleIceCandidate(data.fromUserId, data.candidate);
    });

    // Handle peer left the call
    this.socket.on("videocall:peer-left", (data: {
      peerId: string;
    }) => {
      console.log("[WebRTC] Peer left:", data.peerId);
      this.closePeerConnection(data.peerId);
      this.eventHandlers?.onPeerDisconnected(data.peerId);
    });

    console.log("[WebRTC] Socket listeners set up");
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
      if (event.candidate) {
        console.log(`[WebRTC] ICE candidate for ${userId}:`, {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
        });
        if (this.socket) {
          this.socket.emit("videocall:ice-candidate", {
            callId: this.currentCallId,
            toUserId: userId,
            candidate: event.candidate.toJSON(),
          });
        }
      } else {
        console.log(`[WebRTC] ICE gathering complete for ${userId}`);
      }
    };

    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering state with ${userId}:`, pc.iceGatheringState);
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
      console.log(`[WebRTC] Connection state with ${userId}:`, pc.connectionState);
      this.eventHandlers?.onConnectionStateChange(userId, pc.connectionState);
      
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.log(`[WebRTC] Connection ${pc.connectionState} with ${userId}, cleaning up`);
        this.closePeerConnection(userId);
        this.eventHandlers?.onPeerDisconnected(userId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state with ${userId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error(`[WebRTC] ICE connection failed with ${userId}. Check TURN server configuration.`);
        // Try ICE restart
        console.log(`[WebRTC] Attempting ICE restart for ${userId}`);
        pc.restartIce();
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state with ${userId}:`, pc.signalingState);
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
      
      // If already stable with remote description, connection is established - skip
      if (pc.signalingState === "stable" && pc.remoteDescription) {
        console.log("[WebRTC] Connection already established, skipping offer");
        return;
      }
      
      // If already have-local-offer, we already sent an offer - skip
      if (pc.signalingState === "have-local-offer") {
        console.log("[WebRTC] Already sent offer, waiting for answer");
        return;
      }
      
      // If in have-remote-offer, we received their offer - don't create ours
      if (pc.signalingState === "have-remote-offer") {
        console.log("[WebRTC] Have remote offer, should send answer not offer");
        return;
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
    
    // Check if we already have a connection
    let pc = this.peerConnections.get(fromUserId);
    if (pc) {
      console.log("[WebRTC] Already have connection for", fromUserId, "- state:", pc.signalingState);
      
      // If connection is stable and has remote description, it's already established - skip
      if (pc.signalingState === "stable" && pc.remoteDescription) {
        console.log("[WebRTC] Connection already established, ignoring duplicate offer");
        return;
      }
      
      // If connection is in have-local-offer state, we have a glare situation
      // Use polite peer logic - higher ID yields (closes and accepts incoming offer)
      if (pc.signalingState === "have-local-offer") {
        if (this.currentUserId && this.currentUserId > fromUserId) {
          console.log("[WebRTC] Glare detected - we yield (higher ID), accepting their offer");
          pc.close();
          this.peerConnections.delete(fromUserId);
          pc = this.createPeerConnection(fromUserId);
        } else {
          console.log("[WebRTC] Glare detected - they yield (higher ID), ignoring their offer");
          return;
        }
      }
      
      // If in other wrong states, recreate
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
      if (pending && pending.length > 0) {
        console.log(`[WebRTC] Processing ${pending.length} pending ICE candidates for ${fromUserId}`);
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingCandidates.delete(fromUserId);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("[WebRTC] Sending answer to:", fromUserId);
      this.socket?.emit("videocall:answer", {
        callId,
        toUserId: fromUserId,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error("[WebRTC] Error handling offer:", error);
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
      if (pending && pending.length > 0) {
        console.log(`[WebRTC] Processing ${pending.length} pending ICE candidates for ${fromUserId}`);
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
      console.log(`[WebRTC] Queued ICE candidate from ${fromUserId} (no remote description yet)`);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`[WebRTC] Added ICE candidate from ${fromUserId}:`, candidate.candidate?.split(" ").slice(4, 7).join(" "));
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
    console.log("[WebRTC] Cleaning up...");
    
    // Close all peer connections
    this.peerConnections.forEach((pc, oderId) => {
      console.log("[WebRTC] Closing connection to:", oderId);
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

    // Remove socket listeners
    this.removeSocketListeners();
    
    this.currentCallId = null;
    this.isInitialized = false;
    
    console.log("[WebRTC] Cleanup complete");
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
