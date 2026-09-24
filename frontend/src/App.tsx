import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import Interviews from "./pages/Interviews";
import QuestionBank from "./pages/QuestionBank";
import AIInterview from "./pages/AIInterview";
import InterviewResults from "./pages/InterviewResults";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import InterviewHistory from "./pages/InterviewHistory";


function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="auth-logo">
          IntervueAI
        </div>

        <div className="nav-actions">
          <a href="/login">
            Sign In
          </a>

          <a
            href="/register"
            className="nav-button"
          >
            Get Started
          </a>
        </div>
      </nav>

      <main className="landing-content">
        <span className="hero-badge">
          ✨ AI-Powered Interview Preparation
        </span>

        <h1>
          Prepare smarter.
          <br />
          <span>Interview better.</span>
        </h1>

        <p>
          Practice personalized interviews,
          get instant AI feedback, identify
          skill gaps and become
          interview-ready.
        </p>

        <div className="hero-actions">
          <a
            href="/register"
            className="hero-button"
          >
            Start Preparing →
          </a>

          <a
            href="/login"
            className="secondary-button"
          >
            Sign In
          </a>
        </div>
      </main>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Landing */}

          <Route
            path="/"
            element={<Landing />}
          />

          {/* Authentication */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Resume */}

          <Route
            path="/resume-analysis"
            element={
              <ProtectedRoute>
                <ResumeAnalysis />
              </ProtectedRoute>
            }
          />

          {/* Interviews */}

          <Route
            path="/create-interview"
            element={
              <ProtectedRoute>
                <CreateInterview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <Interviews />
              </ProtectedRoute>
            }
          />

          {/* Interview History */}

          <Route
            path="/interview-history"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />

          {/* AI Interview */}

          <Route
            path="/interviews/:id/ai-interview"
            element={
              <ProtectedRoute>
                <AIInterview />
              </ProtectedRoute>
            }
          />

          {/* Question Bank */}

          <Route
            path="/interviews/:id/questions"
            element={
              <ProtectedRoute>
                <QuestionBank />
              </ProtectedRoute>
            }
          />

          {/* Interview Results */}

          <Route
            path="/interview-results/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;