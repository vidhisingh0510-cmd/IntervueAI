import api from "./api";

export interface InterviewQuestion {
  id: number;
  interview_id: number;
  question: string;
  category: string;
  difficulty: string;
  source_name?: string | null;
  source_url?: string | null;
  created_at: string;
}

export interface ResearchResponse {
  message: string;
  questions_found: number;
  questions: InterviewQuestion[];
}

export async function researchQuestions(
  interviewId: number
): Promise<ResearchResponse> {
  const response = await api.post(
    `/api/questions/research/${interviewId}`
  );

  return response.data;
}

export async function getInterviewQuestions(
  interviewId: number
): Promise<InterviewQuestion[]> {
  const response = await api.get(
    `/api/questions/interview/${interviewId}`
  );

  return response.data;
}

export async function deleteQuestion(
  questionId: number
) {
  const response = await api.delete(
    `/api/questions/${questionId}`
  );

  return response.data;
}