import api from "./api";

export interface CategoryPerformance {
  category: string;
  average_score: number;
  questions_answered: number;
}

export interface RecentInterview {
  session_id: number;
  interview_id: number;
  title: string;
  role: string;
  company?: string | null;
  score?: number | null;
  status: string;
  completed_at?: string | null;
}

export interface Analytics {
  total_interviews: number;
  completed_interviews: number;
  total_questions_answered: number;
  average_score?: number | null;
  category_performance: CategoryPerformance[];
  recent_interviews: RecentInterview[];
}

export async function getDashboardAnalytics(): Promise<Analytics> {
  const response = await api.get(
    "/api/analytics/dashboard"
  );

  return response.data;
}