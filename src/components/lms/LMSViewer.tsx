import React, { useState, useEffect } from 'react';
import { SESSIONS_DATA, SessionData } from '../../data/lmsData.ts';
import { SimulatorTab } from '../shell/Header.tsx';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  PlayCircle, 
  HelpCircle, 
  ExternalLink, 
  Search, 
  Award, 
  Video, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  ArrowRight,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

interface LMSViewerProps {
  onLaunchSimulator: (tab: SimulatorTab) => void;
}

export const LMSViewer: React.FC<LMSViewerProps> = ({ onLaunchSimulator }) => {
  const [selectedUnit, setSelectedUnit] = useState<number>(0); // 0 = All Units
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSessionNumber, setSelectedSessionNumber] = useState<number>(1);
  const [activeQuadrant, setActiveQuadrant] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

  // Quiz state for current session
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Completed sessions persistent tracker
  const [completedSessions, setCompletedSessions] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('coaviz_completed_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleSessionCompletion = (sessionNum: number) => {
    setCompletedSessions((prev) => {
      const next = prev.includes(sessionNum)
        ? prev.filter((s) => s !== sessionNum)
        : [...prev, sessionNum];
      try {
        localStorage.setItem('coaviz_completed_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filtered session list
  const filteredSessions = SESSIONS_DATA.filter((session) => {
    const matchesUnit = selectedUnit === 0 || session.unitNumber === selectedUnit;
    const matchesSearch =
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.q2.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.unitTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  const currentSession: SessionData = 
    SESSIONS_DATA.find((s) => s.sessionNumber === selectedSessionNumber) || SESSIONS_DATA[0];

  // Reset quiz on session change
  useEffect(() => {
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
  }, [selectedSessionNumber]);

  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
    // Check if full score
    const questions = currentSession.q3.questions;
    const isPerfect = questions.every((q) => selectedAnswers[q.id] === q.correctIndex);
    if (isPerfect) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (!completedSessions.includes(currentSession.sessionNumber)) {
        toggleSessionCompletion(currentSession.sessionNumber);
      }
    }
  };

  const calculateScore = () => {
    const questions = currentSession.q3.questions;
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) correct++;
    });
    return { correct, total: questions.length };
  };

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* Top LMS Header Banner */}
      <div className="panel-card p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                60-Session IV-Quadrant LMS Course Hub
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                21CSS201T COA
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Interactive syllabus navigation, e-tutorials, lecture notes, instant self-assessments, and video references.
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-3 sub-panel px-4 py-2 border">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Syllabus Progress</span>
            <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
              {completedSessions.length} / {SESSIONS_DATA.length} Sessions Completed
            </span>
          </div>
        </div>
      </div>

      {/* Navigation & Session Selector Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 4 Cols: Session Directory / Filter List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="panel-card p-4 shadow-xl flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search topics, keywords, CO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-box pl-9 pr-3 py-2 text-xs"
              />
            </div>

            {/* Unit Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedUnit(0)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedUnit === 0
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Units
              </button>
              {[1, 2, 3, 4, 5].map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(u)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedUnit === u
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Unit {u}
                </button>
              ))}
            </div>

            {/* Session Items Scrollable List */}
            <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredSessions.map((session) => {
                const isSelected = session.sessionNumber === selectedSessionNumber;
                const isDone = completedSessions.includes(session.sessionNumber);
                return (
                  <div
                    key={session.sessionNumber}
                    onClick={() => setSelectedSessionNumber(session.sessionNumber)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-500/10 scale-[1.01]'
                        : 'sub-panel border hover:border-cyan-500/40'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSessionCompletion(session.sessionNumber);
                      }}
                      title={isDone ? 'Mark as Incomplete' : 'Mark as Complete'}
                      className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                          Session {session.sessionNumber} (Unit {session.unitNumber})
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                          {session.courseOutcome}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {session.topic}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: 4-Quadrant Main Content Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Active Session Banner Card */}
          <div className="panel-card p-5 shadow-xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  Session {currentSession.sessionNumber}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{currentSession.unitTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSessionCompletion(currentSession.sessionNumber)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    completedSessions.includes(currentSession.sessionNumber)
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      : 'sub-panel border hover:border-slate-400 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedSessions.includes(currentSession.sessionNumber) ? 'Completed' : 'Mark Done'}
                </button>

                <button
                  onClick={() => onLaunchSimulator(currentSession.simulatorTab)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20 hover:scale-105 transition-all"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Launch Interactive Simulator
                </button>
              </div>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{currentSession.topic}</h3>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span><strong>Teaching Method:</strong> {currentSession.teachingMethod}</span>
              <span>•</span>
              <span><strong>Duration:</strong> {currentSession.duration}</span>
              <span>•</span>
              <span><strong>Course Outcome:</strong> {currentSession.courseOutcome}</span>
            </div>

            {/* 4 Quadrants Switcher Tabs */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveQuadrant('Q1')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeQuadrant === 'Q1'
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quadrant I:</span> e-Tutorial
              </button>

              <button
                onClick={() => setActiveQuadrant('Q2')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeQuadrant === 'Q2'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-slate-950 shadow-md shadow-indigo-500/20'
                    : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quadrant II:</span> Notes
              </button>

              <button
                onClick={() => setActiveQuadrant('Q3')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeQuadrant === 'Q3'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quadrant III:</span> Quiz
              </button>

              <button
                onClick={() => setActiveQuadrant('Q4')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeQuadrant === 'Q4'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'sub-panel border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quadrant IV:</span> References
              </button>
            </div>
          </div>

          {/* Quadrant Body Workspace */}
          <div className="panel-card p-6 shadow-2xl flex flex-col gap-4 min-h-[380px]">
            {/* QUADRANT I: Interactive Simulator & e-Tutorial */}
            {activeQuadrant === 'Q1' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {currentSession.q1.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onLaunchSimulator(currentSession.simulatorTab)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                  >
                    Open Simulator
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl sub-panel border flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lab Objective:</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {currentSession.q1.objective}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step-by-Step Guided Procedure:
                  </span>
                  <div className="flex flex-col gap-2">
                    {currentSession.q1.guidedSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 sub-panel p-2.5 border">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-1.5 mt-2">
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Key Architectural Takeaway:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {currentSession.q1.keyObservation}
                  </p>
                </div>
              </div>
            )}

            {/* QUADRANT II: Lecture Notes & e-Content */}
            {activeQuadrant === 'Q2' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Conceptual Notes & Core Syllabus Summary
                  </h4>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed sub-panel p-4 border font-medium">
                  {currentSession.q2.summary}
                </p>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Core Architectural Insights:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {currentSession.q2.keyPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200 sub-panel p-2.5 border">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl sub-panel border flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Textbook References
                    </span>
                    <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                      {currentSession.q2.references.textbooks.map((tb, idx) => (
                        <li key={idx}>{tb}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl sub-panel border flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Classroom Slide Mapping
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                      {currentSession.q2.references.pptSlides}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* QUADRANT III: Self-Assessment Quizzes */}
            {activeQuadrant === 'Q3' && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {currentSession.q3.quizTitle}
                    </h4>
                  </div>
                  {isQuizSubmitted && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        Score: {calculateScore().correct} / {calculateScore().total}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAnswers({});
                          setIsQuizSubmitted(false);
                        }}
                        className="p-1.5 rounded-lg sub-panel border hover:border-slate-400 text-slate-700 dark:text-slate-300"
                        title="Retake Quiz"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5">
                  {currentSession.q3.questions.map((q, qIdx) => {
                    const selectedIdx = selectedAnswers[q.id];
                    return (
                      <div key={q.id} className="p-4 rounded-xl sub-panel border flex flex-col gap-3">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {qIdx + 1}. {q.question}
                        </span>

                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedIdx === optIdx;
                            const isCorrect = isQuizSubmitted && optIdx === q.correctIndex;
                            const isWrong = isQuizSubmitted && isSelected && optIdx !== q.correctIndex;

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectAnswer(q.id, optIdx)}
                                className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : isWrong
                                    ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200 font-bold'
                                    : isSelected
                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-semibold'
                                    : 'sub-panel border hover:border-slate-400 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full border border-slate-400 dark:border-slate-600 flex items-center justify-center text-[10px] font-mono shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isQuizSubmitted && (
                          <div className="p-3 rounded-lg sub-panel border text-[11px] text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                            <span className="font-bold text-cyan-700 dark:text-cyan-300">Explanation:</span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isQuizSubmitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    Submit Self-Assessment & Check Answers
                  </button>
                )}
              </div>
            )}

            {/* QUADRANT IV: References & External Video Links */}
            {activeQuadrant === 'Q4' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Curated Online Lectures & External Reading
                  </h4>
                </div>

                {/* Video Resources */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Recommended Video Playlists & Lectures:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentSession.q4.videoLinks.map((v, idx) => (
                      <a
                        key={idx}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl sub-panel hover:border-cyan-500 border transition-all flex items-center justify-between group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                            {v.title}
                          </span>
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{v.channel}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Reading Resources */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Interactive Web Tutorials & Reference Papers:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentSession.q4.readingLinks.map((r, idx) => (
                      <a
                        key={idx}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl sub-panel hover:border-emerald-500 border transition-all flex items-center justify-between group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            {r.title}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{r.source}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
