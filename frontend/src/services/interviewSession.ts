import api from "./api";

export interface InterviewSession {
  id: number;
  interview_id: number;
  user_id: number;
  current_question_index: number;
  status: string;
  total_score?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface InterviewAnswer {
  id: number;
  session_id: number;
  question_id: number;
  answer: string;
  score?: number | null;
  feedback?: string | null;
  strengths?: string | null;
  improvements?: string | null;
  created_at: string;
}

export interface SubmitAnswerData {
  question_id: number;
  answer: string;
}

export async function startInterview(
  interviewId: number
): Promise<InterviewSession> {
  const response = await api.post(
    `/api/interview-sessions/start/${interviewId}`
  );

  return response.data;
}

export async function getInterviewSession(
  sessionId: number
): Promise<InterviewSession> {
  const response = await api.get(
    `/api/interview-sessions/${sessionId}`
  );

  return response.data;
}

export async function submitAnswer(
  sessionId: number,
  data: SubmitAnswerData
): Promise<InterviewAnswer> {
  const response = await api.post(
    `/api/interview-sessions/${sessionId}/answer`,
    data
  );

  return response.data;
}

export async function getSessionAnswers(
  sessionId: number
): Promise<InterviewAnswer[]> {
  const response = await api.get(
    `/api/interview-sessions/${sessionId}/answers`
  );

  return response.data;
}