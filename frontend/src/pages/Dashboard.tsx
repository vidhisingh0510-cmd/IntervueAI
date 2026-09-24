import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardAnalytics,
  type Analytics,
} from "../services/analytics";

export default function Dashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data =
          await getDashboardAnalytics();

        setAnalytics(data);
      } catch {
        setError(
          "Unable to load performance data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div className="feature-card">
            <h2>Loading dashboard...</h2>
            <p>
              Preparing your interview
              performance data.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="dashboard-page">
        <nav className="dashboard-nav">
          <div className="auth-logo">
            IntervueAI
          </div>

          <button
            className="logout-button"
            onClick={() =>
              navigate("/interviews")
            }
          >
            Interviews
          </button>
        </nav>

        <main className="dashboard-content">
          <div className="feature-card">
            <h2>Dashboard unavailable</h2>
            <p>
              {error ||
                "Unable to load your performance data."}
            </p>

            <button
              className="hero-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
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

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="logout-button"
            onClick={() =>
              navigate("/interviews")
            }
          >
            Interviews
          </button>

          <button
            className="logout-button"
            onClick={() =>
              navigate("/resume-analysis")
            }
          >
            Resume
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-card">
          <span className="welcome-label">
            Performance Dashboard
          </span>

          <h1>
            Your Interview Performance
          </h1>

          <p>
            Track your interview progress,
            scores, and areas for improvement.
          </p>
        </div>

        {/* Statistics */}

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              🎯
            </div>

            <h3>Average Score</h3>

            <h2>
              {analytics.average_score !==
              null &&
              analytics.average_score !==
                undefined
                ? `${analytics.average_score}/100`
                : "—"}
            </h2>

            <p>
              Across all answered questions
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              📝
            </div>

            <h3>Total Interviews</h3>

            <h2>
              {analytics.total_interviews}
            </h2>

            <p>
              Interviews created
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              ✅
            </div>

            <h3>Completed</h3>

            <h2>
              {analytics.completed_interviews}
            </h2>

            <p>
              Interviews completed
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              💬
            </div>

            <h3>Questions Answered</h3>

            <h2>
              {analytics.total_questions_answered}
            </h2>

            <p>
              AI-evaluated answers
            </p>
          </div>
        </div>

        {/* Category Performance */}

        <div className="welcome-card">
          <span className="welcome-label">
            Skill Performance
          </span>

          <h2>
            Performance by Category
          </h2>

          <p>
            See how you are performing across
            different interview areas.
          </p>
        </div>

        {analytics.category_performance
          .length === 0 ? (
          <div className="feature-card">
            <h3>
              No category data yet
            </h3>

            <p>
              Complete an interview to see
              your category performance.
            </p>
          </div>
        ) : (
          <div className="feature-grid">
            {analytics.category_performance.map(
              (category) => (
                <div
                  className="feature-card"
                  key={category.category}
                >
                  <div className="feature-icon">
                    {category.category ===
                    "Technical"
                      ? "💻"
                      : category.category ===
                        "Coding"
                      ? "🧠"
                      : category.category ===
                        "Behavioral"
                      ? "🤝"
                      : category.category ===
                        "HR"
                      ? "👔"
                      : "📚"}
                  </div>

                  <h3>
                    {category.category}
                  </h3>

                  <h2>
                    {category.average_score}/100
                  </h2>

                  <p>
                    {
                      category.questions_answered
                    }{" "}
                    question
                    {category.questions_answered !==
                    1
                      ? "s"
                      : ""}{" "}
                    answered
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Recent Interviews */}

        <div className="welcome-card">
          <span className="welcome-label">
            Interview History
          </span>

          <h2>
            Recent Completed Interviews
          </h2>

          <p>
            Review your latest interview
            attempts and detailed results.
          </p>
        </div>

        {analytics.recent_interviews
          .length === 0 ? (
          <div className="feature-card">
            <h3>
              No completed interviews yet
            </h3>

            <p>
              Start an interview to begin
              building your performance history.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                navigate("/interviews")
              }
              style={{
                marginTop: "16px",
              }}
            >
              Go to Interviews
            </button>
          </div>
        ) : (
          <div className="feature-grid">
            {analytics.recent_interviews.map(
              (interview) => (
                <div
                  className="feature-card"
                  key={interview.session_id}
                >
                  <div className="feature-icon">
                    🎤
                  </div>

                  <h3>
                    {interview.title}
                  </h3>

                  <p>
                    {interview.role}
                    {interview.company
                      ? ` • ${interview.company}`
                      : ""}
                  </p>

                  <h2>
                    {interview.score !==
                      null &&
                    interview.score !==
                      undefined
                      ? `${interview.score}/100`
                      : "No score"}
                  </h2>

                  <button
                    className="hero-button"
                    onClick={() =>
                      navigate(
                        `/interview-results/${interview.session_id}`
                      )
                    }
                  >
                    View Results
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Main Actions */}

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              🚀
            </div>

            <h3>
              Start New Interview
            </h3>

            <p>
              Create a personalized AI
              interview based on your role,
              resume, and job description.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                navigate("/create-interview")
              }
              style={{
                marginTop: "16px",
              }}
            >
              Create Interview
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              📄
            </div>

            <h3>
              Analyze Resume
            </h3>

            <p>
              Upload your resume and get
              AI-powered skills, strengths,
              weaknesses, and suggestions.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                navigate("/resume-analysis")
              }
              style={{
                marginTop: "16px",
              }}
            >
              Resume Analysis
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}