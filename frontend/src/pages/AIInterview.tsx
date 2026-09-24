import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  getInterview,
  type Interview,
} from "../services/interview";

import {
  getInterviewQuestions,
  type InterviewQuestion,
} from "../services/question";

import {
  startInterview,
  submitAnswer,
  type InterviewAnswer,
  type InterviewSession,
} from "../services/interviewSession";

export default function AIInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const interviewId = Number(id);

  const [interview, setInterview] =
    useState<Interview | null>(null);

  const [questions, setQuestions] =
    useState<InterviewQuestion[]>([]);

  const [session, setSession] =
    useState<InterviewSession | null>(null);

  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] =
    useState<InterviewAnswer | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterview = async () => {
      try {
        setLoading(true);
        setError("");

        const [interviewData, questionData] =
          await Promise.all([
            getInterview(interviewId),
            getInterviewQuestions(interviewId),
          ]);

        setInterview(interviewData);
        setQuestions(questionData);
      } catch {
        setError("Unable to load interview.");
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [interviewId]);

  const handleStart = async () => {
    if (starting) return;

    try {
      setStarting(true);
      setError("");

      const sessionData =
        await startInterview(interviewId);

      setSession(sessionData);
      setEvaluation(null);
      setAnswer("");
    } catch (err) {
      console.error(
        "Start interview error:",
        err
      );

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 429) {
          setError(
            "AI quota has been reached for now. Please wait for the Gemini quota to reset and try again later."
          );
        } else {
          setError(
            detail ||
              "Unable to start interview."
          );
        }
      } else {
        setError(
          "Unable to start interview."
        );
      }
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!session || submitting) return;

    if (!answer.trim()) {
      setError(
        "Please enter an answer before submitting."
      );
      return;
    }

    const currentQuestion =
      questions[session.current_question_index];

    if (!currentQuestion) {
      setError(
        "Current question could not be found."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setEvaluation(null);

      const result = await submitAnswer(
        session.id,
        {
          question_id: currentQuestion.id,
          answer: answer.trim(),
        }
      );

      setEvaluation(result);

      const nextIndex =
        session.current_question_index + 1;

      const interviewCompleted =
        nextIndex >= questions.length;

      setSession({
        ...session,
        current_question_index: nextIndex,
        status: interviewCompleted
          ? "completed"
          : "in_progress",
        total_score: interviewCompleted
          ? result.score
          : session.total_score,
      });

      setAnswer("");
    } catch (err) {
      console.error(
        "AI evaluation error:",
        err
      );

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 429) {
          setError(
            "AI quota has been reached for now. Please wait for the Gemini quota to reset and try again later."
          );
        } else {
          setError(
            detail ||
              `AI evaluation failed (${
                status || "unknown error"
              }).`
          );
        }
      } else {
        setError(
          "Unable to evaluate your answer."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    setEvaluation(null);
    setError("");
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div className="feature-card">
            <div className="feature-icon">
              ⏳
            </div>

            <h2>Loading interview...</h2>

            <p>
              Preparing your interview questions.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div className="feature-card">
            <div className="feature-icon">
              ⚠️
            </div>

            <h2>Interview not found</h2>

            <p>
              This interview may no longer exist.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                navigate("/interviews")
              }
            >
              Back to Interviews
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (questions.length === 0) {
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
            Back
          </button>
        </nav>

        <main className="dashboard-content">
          <div className="feature-card">
            <div className="feature-icon">
              📝
            </div>

            <h2>No questions available</h2>

            <p>
              Generate interview questions before
              starting the AI interview.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                navigate(
                  `/interviews/${interviewId}/questions`
                )
              }
            >
              Go to Question Bank
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
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
            Back
          </button>
        </nav>

        <main className="dashboard-content">
          <div className="welcome-card">
            <span className="welcome-label">
              AI Interview
            </span>

            <h1>{interview.title}</h1>

            <p>
              {interview.role}
              {interview.company
                ? ` • ${interview.company}`
                : ""}
            </p>

            <div className="user-info">
              <div>
                <span>Questions</span>

                <strong>
                  {questions.length}
                </strong>
              </div>

              <div>
                <span>Difficulty</span>

                <strong>
                  {interview.difficulty}
                </strong>
              </div>

              <div>
                <span>Type</span>

                <strong>
                  {interview.interview_type}
                </strong>
              </div>
            </div>

            {error && (
              <div
                className="auth-error"
                style={{
                  marginTop: "24px",
                }}
              >
                {error}
              </div>
            )}

            <button
              className="hero-button"
              onClick={handleStart}
              disabled={starting}
              style={{
                marginTop: "28px",
              }}
            >
              {starting
                ? "Starting Interview..."
                : "Start Interview →"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion =
    questions[session.current_question_index];

  const completed =
    session.status === "completed" ||
    session.current_question_index >=
      questions.length;

  const displayedQuestionNumber =
    Math.min(
      session.current_question_index + 1,
      questions.length
    );

  const progress =
    completed
      ? 100
      : (session.current_question_index /
          questions.length) *
        100;

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
          Exit Interview
        </button>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-card">
          <span className="welcome-label">
            AI Interview
          </span>

          <h1>{interview.title}</h1>

          <p>
            {interview.role}
            {interview.company
              ? ` • ${interview.company}`
              : ""}
          </p>

          {!completed && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginTop: "28px",
                  marginBottom: "10px",
                  fontSize: "14px",
                  color: "#aaa",
                }}
              >
                <span>
                  Question{" "}
                  {displayedQuestionNumber} of{" "}
                  {questions.length}
                </span>

                <span>
                  {Math.round(progress)}%
                </span>
              </div>

              <div
                style={{
                  height: "7px",
                  width: "100%",
                  background:
                    "rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, #7c3aed, #db2777)",
                    borderRadius: "999px",
                    transition:
                      "width 0.3s ease",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              marginTop: "22px",
            }}
          >
            {error}
          </div>
        )}

        {completed ? (
          <div
            className="feature-card"
            style={{
              marginTop: "22px",
              textAlign: "center",
              padding: "50px 30px",
            }}
          >
            <div
              className="feature-icon"
              style={{
                fontSize: "48px",
              }}
            >
              🎉
            </div>

            <h2>Interview Completed!</h2>

            <p>
              Great job! You completed all{" "}
              {questions.length} interview
              questions.
            </p>

            {evaluation?.score !==
              undefined && (
              <div
                style={{
                  marginTop: "24px",
                  fontSize: "18px",
                }}
              >
                Latest Answer Score:{" "}
                <strong>
                  {evaluation.score}/100
                </strong>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: "30px",
              }}
            >
              <button
                className="hero-button"
                onClick={() =>
                  navigate(
                    `/interview-results/${session.id}`
                  )
                }
              >
                View Interview Results →
              </button>

              <button
                className="logout-button"
                onClick={() =>
                  navigate("/interviews")
                }
              >
                Back to Interviews
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="feature-card"
              style={{
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <span className="welcome-label">
                  {currentQuestion.category}
                </span>

                <span className="question-tag">
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2
                style={{
                  lineHeight: 1.5,
                  marginBottom: "10px",
                }}
              >
                {currentQuestion.question}
              </h2>

              <p
                style={{
                  color: "#777785",
                  fontSize: "14px",
                }}
              >
                Take your time and explain your
                reasoning clearly.
              </p>

              <textarea
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                placeholder="Type your answer here..."
                rows={9}
                disabled={submitting}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.04)",
                  color: "white",
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginTop: "16px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#777785",
                  }}
                >
                  {answer.trim().length}{" "}
                  characters
                </span>

                <button
                  className="hero-button"
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !answer.trim()
                  }
                >
                  {submitting
                    ? "🤖 AI is evaluating..."
                    : "Submit Answer →"}
                </button>
              </div>
            </div>

            {evaluation && (
              <div
                className="feature-card"
                style={{
                  marginTop: "22px",
                  borderColor:
                    "rgba(139,92,246,0.3)",
                }}
              >
                <div
                  className="feature-icon"
                  style={{
                    fontSize: "36px",
                  }}
                >
                  🧠
                </div>

                <span className="welcome-label">
                  AI Feedback
                </span>

                <h2
                  style={{
                    fontSize: "32px",
                    marginTop: "10px",
                  }}
                >
                  {evaluation.score}/100
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: "18px",
                    marginTop: "22px",
                  }}
                >
                  <div>
                    <strong>Feedback</strong>

                    <p>
                      {evaluation.feedback}
                    </p>
                  </div>

                  <div>
                    <strong>Strengths</strong>

                    <p>
                      {evaluation.strengths}
                    </p>
                  </div>

                  <div>
                    <strong>
                      Improvements
                    </strong>

                    <p>
                      {evaluation.improvements}
                    </p>
                  </div>
                </div>

                {!completed && (
                  <button
                    className="hero-button"
                    onClick={handleContinue}
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    Continue to Next Question →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}