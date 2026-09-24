import api from "./api";

export interface Interview {
  id: number;
  user_id: number;
  title: string;
  role: string;
  company?: string | null;
  difficulty: string;
  interview_type: string;
  job_description?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  resume_id?: number | null;
}

export interface CreateInterviewData {
  title: string;
  role: string;
  company?: string;
  difficulty: string;
  interview_type: string;
  job_description?: string;
  resume_id?: number | null;
}

export async function createInterview(
  data: CreateInterviewData
): Promise<Interview> {
  const response = await api.post("/api/interviews", data);
  return response.data;
}

export async function getInterviews(): Promise<Interview[]> {
  const response = await api.get("/api/interviews");
  return response.data;
}

export async function getInterview(id: number): Promise<Interview> {
  const response = await api.get(`/api/interviews/${id}`);
  return response.data;
}

export async function deleteInterview(id: number) {
  const response = await api.delete(`/api/interviews/${id}`);
  return response.data;
}