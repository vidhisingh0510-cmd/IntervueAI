import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { getInterview } from "../services/interview";
import type { Interview } from "../services/interview";

import { getInterviewQuestions } from "../services/question";
import type { InterviewQuestion } from "../services/question";

import {
  getSessionAnswers,
} from "../services/interviewSession";
import type { InterviewAnswer } from "../services/interviewSession";

import {
  getInterviewResult,
} from "../services/interviewResult";
import type { InterviewResult } from "../services/interviewResult";

export default function InterviewResults() {
  const { sessionId } = useParams<{
    sessionId: string;
  }>();

  const navigate = useNavigate();

  const [result, setResult] =
    useState<InterviewResult | null>(null);

  const [answers, setAnswers] =
    useState<InterviewAnswer[]>([]);

  const [questions, setQuestions] =
    useState<InterviewQuestion[]>([]);

  const [interview, setInterview] =
    useState<Interview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError("");

        const id = Number(sessionId);

        const resultData =
          await getInterviewResult(id);

        const [answerData, interviewData] =
          await Promise.all([
            getSessionAnswers(id),
            getInterview(resultData.interview_id),
          ]);

        const questionData =
          await getInterviewQuestions(
            resultData.interview_id
          );

        setResult(resultData);
        setAnswers(answerData);
        setInterview(interviewData);
        setQuestions(questionData);
      } catch {
        setError(
          "Unable to load interview results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [sessionId]);

  function getQuestionText(questionId: number) {
    const question = questions.find(
      (item) => item.id === questionId
    );

    return (
      question?.question ||
      "Question text unavailable."
    );
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-state">
          Loading interview results...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="page-shell">
        <div className="error-message">
          {error || "Results not found."}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/interviews")
          }
        >
          <ArrowLeft size={18} />
          Back to Interviews
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <button
          className="secondary-button"
          onClick={() =>
            navigate("/interviews")
          }
        >
          <ArrowLeft size={18} />
          Back to Interviews
        </button>

        <div>
          <h1>Interview Results</h1>

          {interview && (
            <p>
              {interview.company ||
                "Company not specified"}{" "}
              · {interview.role}
            </p>
          )}
        </div>
      </div>

      <div className="results-hero">
        <div className="results-score">
          <span>Overall Score</span>

          <strong>
            {result.overall_score !== null &&
            result.overall_score !== undefined
              ? `${result.overall_score}%`
              : "--"}
          </strong>

          <small>
            Interview completed
          </small>
        </div>

        <div className="results-stats">
          <div className="result-stat-card">
            <CheckCircle2 size={24} />

            <div>
              <strong>
                {result.answered_questions}
              </strong>

              <span>Answered</span>
            </div>
          </div>

          <div className="result-stat-card">
            <TrendingUp size={24} />

            <div>
              <strong>
                {result.total_questions}
              </strong>

              <span>Total Questions</span>
            </div>
          </div>
        </div>
      </div>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <h2>Category Performance</h2>
            <p>
              Your performance across different
              interview areas.
            </p>
          </div>
        </div>

        {result.category_scores.length === 0 ? (
          <div className="empty-state">
            No category scores available.
          </div>
        ) : (
          <div className="category-score-grid">
            {result.category_scores.map(
              (category) => (
                <div
                  className="category-score-card"
                  key={category.category}
                >
                  <span>
                    {category.category}
                  </span>

                  <strong>
                    {category.average_score}%
                  </strong>

                  <small>
                    {category.question_count}{" "}
                    question
                    {category.question_count !==
                    1
                      ? "s"
                      : ""}
                  </small>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <div className="results-two-column">
        <section className="results-section">
          <div className="section-heading">
            <div>
              <h2>
                <TrendingUp size={20} />
                Strengths
              </h2>
            </div>
          </div>

          {result.strengths.length === 0 ? (
            <p className="muted-text">
              No strengths recorded.
            </p>
          ) : (
            <div className="feedback-list">
              {result.strengths.map(
                (strength, index) => (
                  <div
                    className="feedback-item strength"
                    key={index}
                  >
                    <CheckCircle2 size={18} />
                    <span>{strength}</span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="results-section">
          <div className="section-heading">
            <div>
              <h2>
                <AlertCircle size={20} />
                Areas to Improve
              </h2>
            </div>
          </div>

          {result.improvements.length === 0 ? (
            <p className="muted-text">
              No improvements recorded.
            </p>
          ) : (
            <div className="feedback-list">
              {result.improvements.map(
                (improvement, index) => (
                  <div
                    className="feedback-item improvement"
                    key={index}
                  >
                    <AlertCircle size={18} />
                    <span>
                      {improvement}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <h2>Detailed Answer Review</h2>
            <p>
              Review each answer and the AI feedback.
            </p>
          </div>
        </div>

        <div className="answer-history">
          {answers.map(
            (answer, index) => (
              <div
                className="answer-review-card"
                key={answer.id}
              >
                <div className="answer-review-header">
                  <span>
                    Question {index + 1}
                  </span>

                  <strong>
                    {answer.score !== null &&
                    answer.score !== undefined
                      ? `${answer.score}/100`
                      : "--"}
                  </strong>
                </div>

                <h3>
                  {getQuestionText(
                    answer.question_id
                  )}
                </h3>

                <div className="candidate-answer">
                  <span>Your Answer</span>

                  <p>{answer.answer}</p>
                </div>

                {answer.feedback && (
                  <div className="ai-feedback">
                    <span>AI Feedback</span>

                    <p>
                      {answer.feedback}
                    </p>
                  </div>
                )}

                <div className="answer-feedback-grid">
                  {answer.strengths && (
                    <div>
                      <strong>
                        Strengths
                      </strong>

                      <p>
                        {answer.strengths}
                      </p>
                    </div>
                  )}

                  {answer.improvements && (
                    <div>
                      <strong>
                        Improvements
                      </strong>

                      <p>
                        {answer.improvements}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}