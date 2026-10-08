"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Flame, Trophy } from "lucide-react";
import { EntityImage } from "@/components/entity-image";

const modes = ["CURRENT_CLUB", "CAREER_CLUB", "WHO_PLAYED_HERE", "CAREER_PATH", "TWO_CLUBS", "TRANSFER_CONNECTION", "COUNTRY_CHALLENGE"];
const difficulties = ["EASY", "MEDIUM", "HARD", "EXPERT"];

type Question = {
  sessionId: string;
  questionNo: number;
  prompt: string;
  subject: { type: string; name: string; image: string | null; meta: string };
  options: { id: string; label: string }[];
  timer: number;
};

type AnswerFeedback = {
  isCorrect: boolean;
  timedOut: boolean;
  points: number;
  correctAnswerLabel: string;
  completed: boolean;
};

export default function GamePage() {
  const [mode, setMode] = useState("CAREER_CLUB");
  const [difficulty, setDifficulty] = useState("EASY");
  const [sessionId, setSessionId] = useState<string>();
  const [questionNo, setQuestionNo] = useState(1);
  const [question, setQuestion] = useState<Question>();
  const [timer, setTimer] = useState(20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const submittingRef = useRef(false);
  const loadRequestRef = useRef(0);

  async function loadQuestion(next: number, currentSession: string | undefined, selectedMode: string, selectedDifficulty: string) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError(undefined);
    setQuestion(undefined);
    setFeedback(undefined);
    submittingRef.current = false;
    try {
      const response = await fetch("/api/game/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSession, mode: selectedMode, difficulty: selectedDifficulty, questionNo: next, username: "Guest" })
      });
      const payload = await response.json();
      if (!response.ok || !payload.data?.sessionId || !payload.data?.options?.length) {
        throw new Error(payload.error ?? "Could not load a question. Check that the database has enough football records.");
      }
      if (requestId !== loadRequestRef.current) return;
      setQuestion(payload.data as Question);
      setSessionId(payload.data.sessionId);
      setQuestionNo(next);
      setTimer(payload.data.timer);
    } catch (loadError) {
      if (requestId !== loadRequestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Could not load a question.");
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    setSessionId(undefined);
    setQuestionNo(1);
    setScore(0);
    setStreak(0);
    void loadQuestion(1, undefined, mode, difficulty);
  }, [mode, difficulty]);

  async function submitAnswer(optionId: string) {
    if (!question || !sessionId || feedback || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionNo, selectedRefId: optionId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Could not submit your answer.");
      }
      setScore(payload.data.score);
      setStreak(payload.data.streak);
      setFeedback({
        isCorrect: payload.data.isCorrect,
        timedOut: payload.data.timedOut,
        points: payload.data.points,
        correctAnswerLabel: payload.data.correctAnswerLabel,
        completed: payload.data.completed
      });
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Could not submit your answer.");
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!question || feedback || loading || submitting || error || timer > 0) return;
    void submitAnswer("");
  }, [timer, question, feedback, loading, submitting, error]);

  useEffect(() => {
    if (!question || feedback || loading || submitting || timer <= 0) return;
    const id = setTimeout(() => setTimer((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearTimeout(id);
  }, [timer, question, feedback, loading, submitting]);

  async function nextQuestion() {
    if (feedback?.completed || questionNo >= 20) {
      setQuestion(undefined);
      setFeedback(undefined);
      return;
    }
    await loadQuestion(questionNo + 1, sessionId, mode, difficulty);
  }

  async function restartGame() {
    setScore(0);
    setStreak(0);
    setSessionId(undefined);
    setQuestionNo(1);
    await loadQuestion(1, undefined, mode, difficulty);
  }

  const isComplete = !question && !loading && !error && !feedback && questionNo >= 20;

  return (
    <div className="game-layout">
      <div className="topbar">
        <div>
          <h1>MATCH THE PLAYER</h1>
          <p className="muted">{isComplete ? "Game complete" : `Question ${String(questionNo).padStart(2, "0")} / 20`}</p>
        </div>
        <div className="actions">
          <span className="button secondary"><Clock size={18} />{timer}s</span>
          <span className="button"><Trophy size={18} />{score}</span>
          <span className="button accent"><Flame size={18} />{streak}</span>
        </div>
      </div>
      <div className="card">
        <div className="tabs" aria-label="Game mode">
          {modes.map((item) => (
            <button className="tab" type="button" key={item} aria-pressed={mode === item} disabled={loading || submitting} onClick={() => setMode(item)}>
              {item.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <div className="tabs" aria-label="Difficulty">
          {difficulties.map((item) => (
            <button className="tab" type="button" key={item} aria-pressed={difficulty === item} disabled={loading || submitting} onClick={() => setDifficulty(item)}>
              {item}
            </button>
          ))}
        </div>

        {loading && <p className="search-message muted" role="status">Loading a question from the football database…</p>}
        {error && (
          <div className="card section" role="alert">
            <p>{error}</p>
            <button className="button" type="button" onClick={() => void loadQuestion(questionNo, sessionId, mode, difficulty)}>Try again</button>
          </div>
        )}
        {isComplete && (
          <div className="card section" aria-live="polite">
            <h2>Full time!</h2>
            <p>You scored <strong>{score}</strong> points and finished with a streak of <strong>{streak}</strong>.</p>
            <button className="button accent" type="button" onClick={() => void restartGame()}>PLAY AGAIN</button>
          </div>
        )}
        {question && (
          <>
            <div className="identity" style={{ marginTop: 18 }}>
              <EntityImage className="avatar" src={question.subject.image} name={question.subject.name} kind={question.subject.type === "club" ? "club" : "player"} />
              <div>
                <h2>{question.subject.name}</h2>
                <p className="muted">{question.subject.meta}</p>
                <h3>{question.prompt}</h3>
              </div>
            </div>
            <div className="grid cols-2" style={{ marginTop: 18 }}>
              {question.options.map((option, index) => (
                <button className="option" type="button" key={option.id} disabled={submitting || Boolean(feedback)} onClick={() => void submitAnswer(option.id)}>
                  [{String.fromCharCode(65 + index)}] {option.label}
                </button>
              ))}
            </div>
          </>
        )}
        {feedback && (
          <div className="card section" style={{ background: "#f8fff9" }} aria-live="polite">
            <h2>{feedback.timedOut ? "Time is up." : feedback.isCorrect ? `Correct! +${feedback.points} points` : `Not quite. ${feedback.points} points`}</h2>
            <p>The correct answer was <strong>{feedback.correctAnswerLabel}</strong>.</p>
            {feedback.completed ? (
              <button className="button accent" type="button" onClick={() => { setQuestion(undefined); setFeedback(undefined); }}>SEE RESULTS</button>
            ) : (
              <button className="button" type="button" onClick={() => void nextQuestion()}>NEXT QUESTION</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
