import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, BookOpen } from "lucide-react";

import {
  deleteInterview,
  getInterviews,
  type Interview,
} from "../services/interview";

export default function Interviews() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadInterviews = async () => {
    try {
      const data = await getInterviews();
      setInterviews(data);
    } catch {
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this interview?"
    );

    if (!confirmed) return;

    try {
      await deleteInterview(id);

      setInterviews((current) =>
        current.filter((interview) => interview.id !== id)
      );
    } catch {
      alert("Failed to delete interview.");
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const searchText = search.toLowerCase();

    return (
      interview.title.toLowerCase().includes(searchText) ||
      interview.role.toLowerCase().includes(searchText) ||
      (interview.company ?? "").toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="dashboard-page">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="auth-logo">IntervueAI</div>

        <button
          className="logout-button"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
      </nav>

      <main className="dashboard-content">
        {/* Header */}
        <div className="welcome-card">
          <span className="welcome-label">
            Interview Practice
          </span>

          <h1>My Interviews</h1>

          <p>
            Manage your interview preparation sessions.
          </p>

          <button
            className="hero-button"
            onClick={() => navigate("/create-interview")}
          >
            + Create Interview
          </button>
        </div>

        {/* Search */}
        {!loading && interviews.length > 0 && (
          <div
            className="feature-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <Search size={20} />

            <input
              type="text"
              placeholder="Search by title, role or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "inherit",
                fontSize: "16px",
              }}
            />
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="feature-card">
            Loading interviews...
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="feature-card">
            <h3>
              {search
                ? "No matching interviews"
                : "No interviews yet"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Create your first interview to start practicing."}
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredInterviews.map((interview) => (
              <div
                className="feature-card"
                key={interview.id}
              >
                <div className="feature-icon">
                  🎯
                </div>

                <h3>{interview.title}</h3>

                <p>
                  <strong>Role:</strong>{" "}
                  {interview.role}
                </p>

                {interview.company && (
                  <p>
                    <strong>Company:</strong>{" "}
                    {interview.company}
                  </p>
                )}

                <p>
                  <strong>Difficulty:</strong>{" "}
                  {interview.difficulty}
                </p>

                <p>
                  <strong>Type:</strong>{" "}
                  {interview.interview_type}
                </p>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Question Bank */}
                  <button
                    className="hero-button"
                    onClick={() =>
                      navigate(
                        `/interviews/${interview.id}/questions`
                      )
                    }
                  >
                    <BookOpen size={17} />
                    Question Bank
                  </button>

                  {/* Delete */}
                  <button
                    className="logout-button"
                    onClick={() =>
                      handleDelete(interview.id)
                    }
                    title="Delete interview"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}