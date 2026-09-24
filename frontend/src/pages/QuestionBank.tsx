import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";

import { getInterview } from "../services/interview";
import type { Interview } from "../services/interview";

import {
  deleteQuestion,
  getInterviewQuestions,
  researchQuestions,
} from "../services/question";

import type { InterviewQuestion } from "../services/question";


export default function QuestionBank() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const interviewId = Number(id);

      const [interviewData, questionData] = await Promise.all([
        getInterview(interviewId),
        getInterviewQuestions(interviewId),
      ]);

      setInterview(interviewData);
      setQuestions(questionData);
    } catch {
      setError("Unable to load question bank.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleResearch() {
    if (!id) return;

    try {
      setResearching(true);
      setError("");

      const result = await researchQuestions(Number(id));

      setQuestions(result.questions);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to research interview questions."
      );
    } finally {
      setResearching(false);
    }
  }

  async function handleDelete(questionId: number) {
    try {
      await deleteQuestion(questionId);

      setQuestions((current) =>
        current.filter(
          (question) => question.id !== questionId
        )
      );
    } catch {
      setError("Unable to delete question.");
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-state">
          Loading question bank...
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">

      {/* HEADER */}

      <div className="page-header">

        <button
          className="secondary-button"
          onClick={() => navigate("/interviews")}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1>Interview Question Bank</h1>

          {interview && (
            <p>
              {interview.company || "Company not specified"} ·{" "}
              {interview.role}
            </p>
          )}
        </div>

      </div>


      {/* RESEARCH BANNER */}

      <div className="research-banner">

        <div>
          <h2>Build your interview question bank</h2>

          <p>
            Gemini will generate realistic interview questions
            based on this company, role, and job description.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >

          {/* RESEARCH BUTTON */}

          <button
            className="primary-button"
            onClick={handleResearch}
            disabled={researching}
          >
            {researching ? (
              <>
                <Loader2
                  size={18}
                  className="spin"
                />
                Researching...
              </>
            ) : (
              <>
                <Search size={18} />
                Research Questions
              </>
            )}
          </button>


          {/* START AI INTERVIEW BUTTON */}

          {questions.length > 0 && (
            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  `/interviews/${id}/ai-interview`
                )
              }
            >
              Start AI Interview
            </button>
          )}

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* EMPTY STATE */}

      {questions.length === 0 ? (

        <div className="empty-state">

          <Search size={42} />

          <h2>No questions yet</h2>

          <p>
            Click "Research Questions" to build your
            personalized interview question bank.
          </p>

        </div>

      ) : (

        /* QUESTION GRID */

        <div className="question-grid">

          {questions.map((question, index) => (

            <div
              className="question-card"
              key={question.id}
            >

              {/* QUESTION NUMBER */}

              <div className="question-number">
                Q{index + 1}
              </div>


              {/* QUESTION */}

              <h3>
                {question.question}
              </h3>


              {/* CATEGORY + DIFFICULTY */}

              <div className="question-meta">

                <span className="question-tag">
                  {question.category}
                </span>

                <span className="question-tag">
                  {question.difficulty}
                </span>

              </div>


              {/* SOURCE */}

              {question.source_name && (
                <div className="question-source">

                  <span>
                    Source: {question.source_name}
                  </span>

                  {question.source_url && (
                    <a
                      href={question.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}

                </div>
              )}


              {/* DELETE */}

              <button
                className="delete-question-button"
                onClick={() =>
                  handleDelete(question.id)
                }
              >
                <Trash2 size={16} />
                Delete
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}