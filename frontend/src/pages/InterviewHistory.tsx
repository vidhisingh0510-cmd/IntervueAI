import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardAnalytics,
  type RecentInterview,
} from "../services/analytics";

export default function InterviewHistory() {
  const navigate = useNavigate();

  const [interviews, setInterviews] =
    useState<RecentInterview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const data =
          await getDashboardAnalytics();

        setInterviews(
          data.recent_interviews
        );
      } catch {
        setError(
          "Unable to load interview history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

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
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="logout-button"
            onClick={() =>
              navigate("/interviews")
            }
          >
            Interviews
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-card">
          <span className="welcome-label">
            Interview History
          </span>

          <h1>
            Your Completed Interviews
          </h1>

          <p>
            Review your previous interview
            attempts and AI evaluation results.
          </p>
        </div>

        {loading && (
          <div className="feature-card">
            <h3>
              Loading interview history...
            </h3>
          </div>
        )}

        {!loading && error && (
          <div className="feature-card">
            <h3>
              Unable to load history
            </h3>

            <p>{error}</p>

            <button
              className="hero-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          interviews.length === 0 && (
            <div className="feature-card">
              <div className="feature-icon">
                🎤
              </div>

              <h2>
                No completed interviews
              </h2>

              <p>
                Complete your first AI interview
                and your results will appear here.
              </p>

              <button
                className="hero-button"
                onClick={() =>
                  navigate(
                    "/create-interview"
                  )
                }
                style={{
                  marginTop: "16px",
                }}
              >
                Create Interview
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          interviews.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {interviews.map(
                (interview) => (
                  <div
                    className="feature-card"
                    key={interview.session_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span className="welcome-label">
                        Completed Interview
                      </span>

                      <h2>
                        {interview.title}
                      </h2>

                      <p>
                        {interview.role}
                        {interview.company
                          ? ` • ${interview.company}`
                          : ""}
                      </p>

                      {interview.completed_at && (
                        <p
                          style={{
                            opacity: 0.7,
                            fontSize: "13px",
                          }}
                        >
                          Completed:{" "}
                          {new Date(
                            interview.completed_at
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                        }}
                      >
                        <span
                          className="welcome-label"
                        >
                          Score
                        </span>

                        <h2>
                          {interview.score !==
                            null &&
                          interview.score !==
                            undefined
                            ? `${interview.score}/100`
                            : "—"}
                        </h2>
                      </div>

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
                  </div>
                )
              )}
            </div>
          )}
      </main>
    </div>
  );
}