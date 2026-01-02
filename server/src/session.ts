// server/src/session.ts
export type Session = {
  id: string;
  role: "interviewer" | "interviewee";
  createdAt: number;
};

export const sessions = new Map<string, Session>();
