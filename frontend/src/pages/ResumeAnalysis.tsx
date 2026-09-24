import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  Trash2,
  Upload,
  Target,
  Sparkles,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

import {
  analyzeResume,
  deleteResume,
  getResumes,
  uploadResume,
  type Resume,
  type ResumeAnalysis as ResumeAnalysisData,
} from "../services/resume";

export default function ResumeAnalysis() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [resumes, setResumes] =
    useState<Resume[]>([]);

  const [selectedResume, setSelectedResume] =
    useState<Resume | null>(null);

  const [analysis, setAnalysis] =
    useState<ResumeAnalysisData | null>(null);

  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      setLoading(true);
      setError("");

      const data = await getResumes();

      setResumes(data);

      if (data.length > 0) {
        setSelectedResume(data[0]);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Unable to load resumes."));
    } finally {
      setLoading(false);
    }
  }

  function getApiErrorMessage(
    err: any,
    fallback: string
  ): string {
    const detail = err?.response?.data?.detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item: any) => {
          if (typeof item === "string") {
            return item;
          }

          return item?.msg || null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    if (typeof detail === "string") {
      return detail;
    }

    if (err?.message && typeof err.message === "string") {
      return err.message;
    }

    return fallback;
  }

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF resume.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setAnalysis(null);

      const resume = await uploadResume(file);

      setResumes((current) => [
        resume,
        ...current,
      ]);

      setSelectedResume(resume);
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to upload resume."
        )
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleAnalyze() {
    if (!selectedResume || analyzing) return;

    try {
      setAnalyzing(true);
      setError("");
      setAnalysis(null);

      const result = await analyzeResume(
        selectedResume.id,
        role.trim() || undefined,
        jobDescription.trim() || undefined
      );

      setAnalysis(result);
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to analyze resume."
        )
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(resumeId: number) {
    try {
      setError("");

      await deleteResume(resumeId);

      const remaining = resumes.filter(
        (resume) => resume.id !== resumeId
      );

      setResumes(remaining);

      if (selectedResume?.id === resumeId) {
        setSelectedResume(
          remaining.length > 0
            ? remaining[0]
            : null
        );

        setAnalysis(null);
      }
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to delete resume."
        )
      );
    }
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return "Strong profile";
    if (score >= 60) return "Good foundation";
    if (score >= 40) return "Needs improvement";
    return "Needs significant improvement";
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div
            className="feature-card"
            style={{
              textAlign: "center",
              padding: "70px 20px",
            }}
          >
            <Loader2
              size={34}
              className="spin"
            />

            <h2>Loading resumes...</h2>

            <p>
              Preparing your resume workspace.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
            Resume Intelligence
          </span>

          <h1>
            Understand your resume better.
          </h1>

          <p>
            Upload your resume and let AI analyze
            your skills, experience, strengths,
            gaps, and job alignment.
          </p>
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              marginTop: "22px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <AlertTriangle
              size={17}
              style={{
                flexShrink: 0,
                marginTop: "2px",
              }}
            />

            <span>{error}</span>
          </div>
        )}

        <div
          className="feature-card"
          style={{ marginTop: "22px" }}
        >
          <div className="feature-icon">
            <Upload size={26} />
          </div>

          <h2>Upload Resume</h2>

          <p>
            Upload a text-based PDF resume to begin
            your analysis.
          </p>

          <label
            className="hero-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "10px",
              cursor: uploading
                ? "not-allowed"
                : "pointer",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? (
              <>
                <Loader2
                  size={18}
                  className="spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Choose PDF
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>

          <p
            style={{
              fontSize: "13px",
              color: "#777785",
              marginTop: "14px",
              marginBottom: 0,
            }}
          >
            PDF format recommended.
          </p>
        </div>

        {resumes.length > 0 && (
          <div
            className="feature-card"
            style={{ marginTop: "22px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <h2 style={{ marginBottom: "6px" }}>
                  Your Resumes
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#777785",
                  }}
                >
                  Select a resume to analyze.
                </p>
              </div>

              <FileText size={24} />
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {resumes.map((resume) => {
                const selected =
                  resume.id ===
                  selectedResume?.id;

                return (
                  <div
                    key={resume.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      padding: "15px",
                      borderRadius: "12px",
                      background: selected
                        ? "rgba(139,92,246,0.14)"
                        : "rgba(255,255,255,0.035)",
                      border: selected
                        ? "1px solid rgba(139,92,246,0.45)"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedResume(resume);
                        setAnalysis(null);
                        setError("");
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        minWidth: 0,
                      }}
                    >
                      <FileText
                        size={19}
                        style={{
                          flexShrink: 0,
                        }}
                      />

                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {resume.filename}
                      </span>

                      {selected && (
                        <CheckCircle
                          size={17}
                          style={{
                            color: "#a78bfa",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </button>

                    <button
                      className="delete-question-button"
                      onClick={() =>
                        handleDelete(
                          resume.id
                        )
                      }
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {resumes.length === 0 && (
          <div
            className="feature-card"
            style={{
              marginTop: "22px",
              textAlign: "center",
              padding: "55px 20px",
            }}
          >
            <FileText
              size={42}
              style={{ opacity: 0.45 }}
            />

            <h2>No resume uploaded yet</h2>

            <p>
              Upload your first PDF resume above
              to start your analysis.
            </p>
          </div>
        )}

        {selectedResume && (
          <div
            className="feature-card"
            style={{ marginTop: "22px" }}
          >
            <div className="feature-icon">
              <Target size={26} />
            </div>

            <h2>Analyze Resume</h2>

            <p>
              Selected resume:{" "}
              <strong>
                {selectedResume.filename}
              </strong>
            </p>

            <label
              style={{
                display: "block",
                marginTop: "20px",
                marginBottom: "8px",
                color: "#d4d4dd",
                fontSize: "14px",
              }}
            >
              Target Role
            </label>

            <input
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              placeholder="e.g. Software Engineer"
              disabled={analyzing}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
              }}
            />

            <label
              style={{
                display: "block",
                marginTop: "16px",
                marginBottom: "8px",
                color: "#d4d4dd",
                fontSize: "14px",
              }}
            >
              Job Description
              <span
                style={{
                  color: "#777785",
                  marginLeft: "6px",
                }}
              >
                Optional
              </span>
            </label>

            <textarea
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
              placeholder="Paste the job description here to calculate job alignment..."
              rows={7}
              disabled={analyzing}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />

            <button
              className="hero-button"
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "18px",
              }}
            >
              {analyzing ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />
                  AI is analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        )}

        {analysis && (
          <>
            <div
              className="feature-card"
              style={{ marginTop: "22px" }}
            >
              <div className="feature-icon">
                🧠
              </div>

              <span className="welcome-label">
                AI Analysis Complete
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "28px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "56px",
                      margin: 0,
                      letterSpacing: "-2px",
                    }}
                  >
                    {analysis.overall_score}
                    <span
                      style={{
                        fontSize: "24px",
                        color: "#777785",
                      }}
                    >
                      /100
                    </span>
                  </h1>

                  <p
                    style={{
                      color: "#a78bfa",
                      fontWeight: 600,
                    }}
                  >
                    {getScoreLabel(
                      analysis.overall_score
                    )}
                  </p>
                </div>

                {analysis.job_match_score !==
                  null &&
                  analysis.job_match_score !==
                    undefined && (
                    <div
                      style={{
                        padding: "18px 22px",
                        borderRadius: "14px",
                        background:
                          "rgba(124,58,237,0.10)",
                        border:
                          "1px solid rgba(139,92,246,0.2)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#777785",
                          fontSize: "13px",
                        }}
                      >
                        Job Match
                      </span>

                      <strong
                        style={{
                          display: "block",
                          fontSize: "28px",
                          marginTop: "4px",
                        }}
                      >
                        {analysis.job_match_score}%
                      </strong>
                    </div>
                  )}
              </div>

              <p
                style={{
                  marginTop: "20px",
                  lineHeight: 1.7,
                  color: "#b8b8c5",
                }}
              >
                {analysis.summary}
              </p>
            </div>

            <div
              className="feature-card"
              style={{ marginTop: "18px" }}
            >
              <h2>Skills</h2>

              {analysis.skills.length > 0 ? (
                <div
                  className="question-meta"
                  style={{
                    marginTop: "16px",
                  }}
                >
                  {analysis.skills.map(
                    (skill, index) => (
                      <span
                        className="question-tag"
                        key={index}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No skills were identified.
                </p>
              )}
            </div>

            <div
              className="dashboard-grid"
              style={{ marginTop: "18px" }}
            >
              <div className="feature-card">
                <CheckCircle
                  size={24}
                  style={{
                    color: "#a78bfa",
                  }}
                />

                <h2>Strengths</h2>

                {analysis.strengths.length >
                0 ? (
                  analysis.strengths.map(
                    (strength, index) => (
                      <p
                        key={index}
                        style={{
                          lineHeight: 1.6,
                        }}
                      >
                        ✓ {strength}
                      </p>
                    )
                  )
                ) : (
                  <p>
                    No specific strengths
                    identified.
                  </p>
                )}
              </div>

              <div className="feature-card">
                <AlertTriangle
                  size={24}
                  style={{
                    color: "#f59e0b",
                  }}
                />

                <h2>Areas to Improve</h2>

                {analysis.weaknesses.length >
                0 ? (
                  analysis.weaknesses.map(
                    (weakness, index) => (
                      <p
                        key={index}
                        style={{
                          lineHeight: 1.6,
                        }}
                      >
                        • {weakness}
                      </p>
                    )
                  )
                ) : (
                  <p>
                    No major weaknesses
                    identified.
                  </p>
                )}
              </div>
            </div>

            <div
              className="feature-card"
              style={{ marginTop: "18px" }}
            >
              <div className="feature-icon">
                🎯
              </div>

              <h2>Missing Skills</h2>

              {analysis.missing_skills.length >
              0 ? (
                analysis.missing_skills.map(
                  (skill, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      • {skill}
                    </p>
                  )
                )
              ) : (
                <p>
                  No major missing skills were
                  identified for this analysis.
                </p>
              )}
            </div>

            <div
              className="feature-card"
              style={{ marginTop: "18px" }}
            >
              <div className="feature-icon">
                <Lightbulb size={25} />
              </div>

              <h2>Suggestions</h2>

              {analysis.suggestions.length >
              0 ? (
                analysis.suggestions.map(
                  (suggestion, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.7,
                      }}
                    >
                      <strong>
                        {index + 1}.
                      </strong>{" "}
                      {suggestion}
                    </p>
                  )
                )
              ) : (
                <p>
                  No suggestions were returned.
                </p>
              )}
            </div>

            <div
              className="dashboard-grid"
              style={{ marginTop: "18px" }}
            >
              <div className="feature-card">
                <h2>Projects</h2>

                {analysis.projects.map(
                  (project, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      • {project}
                    </p>
                  )
                )}
              </div>

              <div className="feature-card">
                <h2>Education</h2>

                {analysis.education.map(
                  (item, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      • {item}
                    </p>
                  )
                )}
              </div>

              <div className="feature-card">
                <h2>Experience</h2>

                {analysis.experience.map(
                  (item, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      • {item}
                    </p>
                  )
                )}
              </div>

              <div className="feature-card">
                <h2>Certifications</h2>

                {analysis.certifications.map(
                  (item, index) => (
                    <p
                      key={index}
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      • {item}
                    </p>
                  )
                )}
              </div>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            className="secondary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}