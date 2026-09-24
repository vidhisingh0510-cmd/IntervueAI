import api from "./api";

export interface CategoryScore {
  category: string;
  average_score: number;
  question_count: number;
}

export interface InterviewResult {
  session_id: number;
  interview_id: number;
  status: string;
  total_questions: number;
  answered_questions: number;
  overall_score?: number | null;
  category_scores: CategoryScore[];
  strengths: string[];
  improvements: string[];
}

export async function getInterviewResult(
  sessionId: number
): Promise<InterviewResult> {
  const response = await api.get(
    `/api/interview-results/${sessionId}`
  );

  return response.data;
}