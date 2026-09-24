import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createInterview } from "../services/interview";

import {
  getResumes,
  type Resume,
} from "../services/resume";

export default function CreateInterview() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] =
    useState("Medium");
  const [interviewType, setInterviewType] =
    useState("Technical");
  const [jobDescription, setJobDescription] =
    useState("");

  const [resumes, setResumes] =
    useState<Resume[]>([]);

  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await getResumes();
        setResumes(data);
      } catch {
        // Resume selection is optional.
      }
    }

    loadResumes();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await createInterview({
        title,
        role,
        company,
        difficulty,
        interview_type: interviewType,
        job_description: jobDescription,
        resume_id: selectedResumeId,
      });

      navigate("/interviews");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to create interview"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="auth-logo">
          IntervueAI
        </div>

        <button
          className="logout-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </button>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-card">
          <span className="welcome-label">
            Interview Setup
          </span>

          <h1>Create New Interview</h1>

          <p>
            Configure your interview and prepare
            with personalized AI-generated
            questions.
          </p>
        </div>

        <div className="auth-card interview-form-card">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>Interview Title</label>

            <input
              type="text"
              placeholder="e.g. SDE Mock Interview"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
            />

            <label>Target Role</label>

            <input
              type="text"
              placeholder="e.g. Software Development Engineer"
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              required
            />

            <label>Company</label>

            <input
              type="text"
              placeholder="e.g. Amazon"
              value={company}
              onChange={(e) =>
                setCompany(e.target.value)
              }
            />

            <label>Difficulty</label>

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value)
              }
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <label>Interview Type</label>

            <select
              value={interviewType}
              onChange={(e) =>
                setInterviewType(e.target.value)
              }
            >
              <option>Technical</option>
              <option>HR</option>
              <option>Behavioral</option>
              <option>Mixed</option>
            </select>

            <label>Resume</label>

            <select
              value={selectedResumeId ?? ""}
              onChange={(e) =>
                setSelectedResumeId(
                  e.target.value
                    ? Number(e.target.value)
                    : null
                )
              }
            >
              <option value="">
                No resume selected
              </option>

              {resumes.map((resume) => (
                <option
                  key={resume.id}
                  value={resume.id}
                >
                  {resume.filename}
                </option>
              ))}
            </select>

            <p
              style={{
                fontSize: "13px",
                opacity: 0.7,
                marginTop: "-8px",
                marginBottom: "16px",
              }}
            >
              Select a resume to personalize
              your interview questions.
            </p>

            <label>Job Description</label>

            <textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(
                  e.target.value
                )
              }
              rows={7}
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Interview..."
                : "Create Interview →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}