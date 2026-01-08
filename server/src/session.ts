export type Session = {
  id: string;
  role: "interviewer" | "candidate";
  createdAt: number;
  browserId?: string; // Track browser for persistence
};

export type InviteToken = {
  roomId: string;
  role: "interviewer"; // For now, only interviewers can be invited via token
};

export const sessions = new Map<string, Session>();
export const inviteTokens = new Map<string, InviteToken>();
export const roomInterviewers = new Map<string, Set<string>>(); // roomId -> Set<browserId>
