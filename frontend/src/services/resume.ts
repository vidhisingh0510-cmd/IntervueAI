import api from "./api";

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  extracted_text?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ResumeAnalysis {
  resume_id: number;
  overall_score: number;
  summary: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  suggestions: string[];
  job_match_score?: number | null;
}

export async function uploadResume(
  file: File
): Promise<Resume> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
    file.name
  );

  const response = await api.post<Resume>(
    "/api/resumes/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function getResumes(): Promise<Resume[]> {
  const response = await api.get<Resume[]>(
    "/api/resumes/"
  );

  return response.data;
}

export async function getResume(
  resumeId: number
): Promise<Resume> {
  const response = await api.get<Resume>(
    `/api/resumes/${resumeId}`
  );

  return response.data;
}

export async function analyzeResume(
  resumeId: number,
  role?: string,
  jobDescription?: string
): Promise<ResumeAnalysis> {
  const response =
    await api.post<ResumeAnalysis>(
      `/api/resume-analysis/${resumeId}`,
      null,
      {
        params: {
          role,
          job_description: jobDescription,
        },
      }
    );

  return response.data;
}

export async function deleteResume(
  resumeId: number
): Promise<{ message: string }> {
  const response = await api.delete<{
    message: string;
  }>(`/api/resumes/${resumeId}`);

  return response.data;
}