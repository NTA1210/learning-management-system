import http from "../utils/http";

export interface Session {
  _id: string;
  userAgent?: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface SessionsResponse {
  [key: string]: Session;
  success?: boolean;
  message?: string;
  data?: null;
  meta?: {
    timestamp: string;
    timezone: string;
  };
}

export const sessionService = {
  // Get all sessions
  getAllSessions: async (): Promise<Session[]> => {
    const response = await http.get<SessionsResponse>("/sessions");
    
    // The response is an object with numeric keys and metadata
    // http.get() already returns response.data from axios, so response is the full object
    const sessions: Session[] = [];
    
    // Extract sessions from the response object (skip metadata keys)
    if (response && typeof response === 'object') {
      Object.keys(response).forEach((key) => {
        // Skip metadata keys - only process numeric keys or keys that look like session objects
        if (key !== "success" && key !== "message" && key !== "data" && key !== "meta") {
          const session = response[key];
          // Check if it's a valid session object
          if (session && typeof session === 'object' && session._id && session.createdAt) {
            sessions.push(session as Session);
          }
        }
      });
    }
    
    // Sort by createdAt descending (most recent first)
    return sessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Delete a session (force logout)
  deleteSession: async (sessionId: string): Promise<void> => {
    await http.del(`/sessions/${sessionId}`);
  },
};

