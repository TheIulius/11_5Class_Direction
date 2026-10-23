import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  BookOpen,
  Award,
  Clock,
  Send,
  Layers
} from 'lucide-react';
import {
  OFFICIAL_OPEN_QUESTIONS,
  OpenQuestionItem,
  EvaluationResult,
  evaluateOpenAnswer
} from '../data/testsData';
import { soundEffects } from '../utils/soundEffects';

interface OpenQuestionsSectionProps {
  topicId: string;
  topicTitle: string;
  onSelectTopic?: (topicId: any) => void;
}

export const OpenQuestionsSection: React.FC<OpenQuestionsSectionProps> = ({
  topicId,
  topicTitle,
  onSelectTopic
}) => {
  const questions: OpenQuestionItem[] = OFFICIAL_OPEN_QUESTIONS[topicId] || [];

  // Local storage answer state
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    const initial: Record<string, string> = {};
    questions.forEach(q => {
      try {
        const saved = localStorage.getItem(`11_5_open_ans_${q.id}`);
        if (saved) initial[q.id] = saved;
      } catch {}
    });
    return initial;
  });

  // Local storage table answer state (for table questions like iarali-open-13)
  const [tableAnswers, setTableAnswers] = useState<Record<string, { example: string; effect: string }[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`11_5_open_table_${topicId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Local storage evaluations
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>(() => {
    if (typeof window === 'undefined') return {};
    const initial: Record<string, EvaluationResult> = {};
    questions.forEach(q => {
      try {
        const saved = localStorage.getItem(`11_5_open_eval_${q.id}`);
        if (saved) initial[q.id] = JSON.parse(saved);
      } catch {}
    });
    return initial;
  });

  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Sync state when topicId changes
  useEffect(() => {
    const freshAns: Record<string, string> = {};
    const freshEval: Record<string, EvaluationResult> = {};
    questions.forEach(q => {
      try {
        const a = localStorage.getItem(`11_5_open_ans_${q.id}`);
        if (a) freshAns[q.id] = a;
        const e = localStorage.getItem(`11_5_open_eval_${q.id}`);
        if (e) freshEval[q.id] = JSON.parse(e);
      } catch {}
    });
    setAnswers(freshAns);
    setEvaluations(freshEval);

    try {
      const savedTable = localStorage.getItem(`11_5_open_table_${topicId}`);
      if (savedTable) {
        setTableAnswers(JSON.parse(savedTable));
      } else {
        setTableAnswers({});
      }
    } catch {}
  }, [topicId]);

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    try {
      localStorage.setItem(`11_5_open_ans_${qId}`, val);
    } catch {}
  };

  const handleTableChange = (qId: string, rowIndex: number, field: 'example' | 'effect', val: string) => {
    setTableAnswers(prev => {
      const currentRows = prev[qId] ? [...prev[qId]] : [
        { example: '', effect: '' },
        { example: '', effect: '' },
        { example: '', effect: '' }
      ];
      if (!currentRows[rowIndex]) {
        currentRows[rowIndex] = { example: '', effect: '' };
      }
      currentRows[rowIndex] = { ...currentRows[rowIndex], [field]: val };
      const next = { ...prev, [qId]: currentRows };
      try {
        localStorage.setItem(`11_5_open_table_${topicId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleEvaluate = async (item: OpenQuestionItem) => {
    soundEffects.click();
    let textToEvaluate = answers[item.id] || '';

    // If it's a table question, compose the table answer text
    if (item.type === 'table') {
      const rows = tableAnswers[item.id] || [];
      const tableTextParts = (item.tableRows || []).map((r, i) => {
        const userRow = rows[i] || { example: '', effect: '' };
        return `${r.device}: მაგალითი - "${userRow.example}"; დანიშნულება - "${userRow.effect}"`;
      });
      textToEvaluate = tableTextParts.join('\n');
      if (!answers[item.id]) {
        handleAnswerChange(item.id, textToEvaluate);
      }
    }

    setLoadingQuestions(prev => ({ ...prev, [item.id]: true }));

    try {
      const result = await evaluateOpenAnswer(item, textToEvaluate);
      setEvaluations(prev => ({ ...prev, [item.id]: result }));
      try {
        localStorage.setItem(`11_5_open_eval_${item.id}`, JSON.stringify(result));
      } catch {}

      if (result.status === 'correct') {
        soundEffects.success();
      } else {
        soundEffects.click();
      }
    } catch (err) {
      console.error('[OpenQuestions] Evaluation error:', err);
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleResetAnswer = (qId: string) => {
    soundEffects.click();
    setAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setEvaluations(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    try {
      localStorage.removeItem(`11_5_open_ans_${qId}`);
      localStorage.removeItem(`11_5_open_eval_${qId}`);
    } catch {}
  };

  // Calculations
  const totalQuestions = questions.length;
  const maxPossibleScore = questions.reduce((sum, q) => sum + q.points, 0);
  const currentTotalScore = Object.values(evaluations).reduce((sum, e) => sum + e.score, 0);
  const completedCount = Object.keys(evaluations).length;
  const progressPercent = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  if (questions.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#181928] border border-[#f5f2eb]/15 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <PenTool className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#fcfbf7]">
            „{topicTitle}“ — ღია ჩასაწერი დავალებები მზადების პროცესშია
          </h3>
          <p className="text-xs text-[#b8b5a8] max-w-md mx-auto">
            ამ ეტაპზე ოფიციალური ღია ტესტური დავალებები და AI შეფასება ხელმისაწვდომია შემდეგ თემებზე:
          </p>
        </div>

        {onSelectTopic && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => {
                soundEffects.click();
                onSelectTopic('visac-gsurt');
              }}
              className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold text-red-200 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>2. ვისაც გსურთ (7 ღია დავალება)</span>
            </button>
            <button
              onClick={() => {
                soundEffects.click();
                onSelectTopic('iarali');
              }}
              className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold text-red-200 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>7. იარალის (10 ღია დავალება)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#141522]/95 border border-[#f5f2eb]/15 shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#fcfbf7] flex items-center gap-2">
                <span>ღია კითხვები &amp; ჩასაწერი დავალებები</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  ოფიციალური ტესტი
                </span>
              </h3>
              <p className="text-[11px] text-[#b8b5a8]">
                {topicTitle} • შეასრულეთ წერილობით და შეამოწმეთ AI ექსპერტით
              </p>
            </div>
          </div>
        </div>

        {/* Progress & Score Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-[#181928] border border-[#f5f2eb]/10 flex items-center justify-between">
            <span className="text-xs text-[#b8b5a8]">პროგრესი:</span>
            <span className="text-xs font-mono font-bold text-[#fcfbf7]">
              {completedCount} / {totalQuestions} დავალება ({progressPercent}%)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#181928] border border-[#f5f2eb]/10 flex items-center justify-between">
            <span className="text-xs text-[#b8b5a8]">დაგროვილი ქულა:</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {currentTotalScore} / {maxPossibleScore} ქულა
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#181928] border border-[#f5f2eb]/10 flex items-center justify-between">
            <span className="text-xs text-[#b8b5a8]">შენახვა:</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> ავტო-დამახსოვრება
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id] || '';
          const evalResult = evaluations[q.id];
          const isLoading = loadingQuestions[q.id];
          const isKeyExpanded = expandedKeys[q.id];
          const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 sm:p-5 rounded-3xl bg-[#141522]/95 border border-[#f5f2eb]/15 shadow-xl space-y-3.5"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f5f2eb]/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-mono font-bold">
                    {q.numberLabel}
                  </span>
                  <span className="text-xs font-bold text-[#fcfbf7]">
                    {q.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                    მაქს. {q.points} ქულა
                  </span>
                  {evalResult && (
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        evalResult.status === 'correct'
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          : evalResult.status === 'partial'
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                          : 'bg-red-500/20 border-red-500/30 text-red-300'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      {evalResult.score} / {evalResult.maxScore} ქულა
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-xs sm:text-sm font-semibold text-[#fcfbf7] leading-relaxed">
                {q.question}
              </div>

              {/* Table Input Layout for Table Questions (e.g. Question 13) */}
              {q.type === 'table' && q.tableRows && (
                <div className="space-y-2 pt-1 overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse border border-[#f5f2eb]/15 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-[#181928] text-[#d4d1c5]">
                        <th className="border border-[#f5f2eb]/15 p-2 text-left w-1/4">მხატვრული ხერხი</th>
                        <th className="border border-[#f5f2eb]/15 p-2 text-left w-3/8">მაგალითი ლექსიდან</th>
                        <th className="border border-[#f5f2eb]/15 p-2 text-left w-3/8">დანიშნულება / ეფექტი</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.tableRows.map((row, rIdx) => {
                        const userRow = (tableAnswers[q.id] && tableAnswers[q.id][rIdx]) || {
                          example: '',
                          effect: ''
                        };
                        return (
                          <tr key={rIdx} className="bg-[#12131d]/90">
                            <td className="border border-[#f5f2eb]/15 p-2 font-bold text-red-300">
                              {row.device}
                            </td>
                            <td className="border border-[#f5f2eb]/15 p-1.5">
                              <input
                                type="text"
                                value={userRow.example}
                                onChange={e => handleTableChange(q.id, rIdx, 'example', e.target.value)}
                                placeholder="მაგალითი ტექსტიდან..."
                                className="w-full px-2 py-1.5 rounded-lg bg-[#181928] border border-[#f5f2eb]/10 text-xs text-[#fcfbf7] placeholder-[#6b675c] focus:outline-none focus:border-red-500"
                              />
                            </td>
                            <td className="border border-[#f5f2eb]/15 p-1.5">
                              <input
                                type="text"
                                value={userRow.effect}
                                onChange={e => handleTableChange(q.id, rIdx, 'effect', e.target.value)}
                                placeholder="რა ეფექტი აქვს..."
                                className="w-full px-2 py-1.5 rounded-lg bg-[#181928] border border-[#f5f2eb]/10 text-xs text-[#fcfbf7] placeholder-[#6b675c] focus:outline-none focus:border-red-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Textarea for general input */}
              <div className="space-y-1.5">
                <textarea
                  value={userAnswer}
                  onChange={e => handleAnswerChange(q.id, e.target.value)}
                  placeholder={
                    q.type === 'table'
                      ? 'შეგიძლიათ დაამატოთ დამატებითი კომენტარი ან შეავსოთ ზემოთ მოცემული ცხრილი...'
                      : 'ჩაწერეთ თქვენი პასუხი აქ (დაფიქრდით ტექსტის შინაარსზე, მხატვრულ ხერხებზე და მოიყვანეთ არგუმენტები)...'
                  }
                  rows={q.type === 'reflection' ? 4 : 3}
                  className="w-full p-3 rounded-2xl bg-[#12131d]/90 border border-[#f5f2eb]/15 text-xs sm:text-sm text-[#fcfbf7] placeholder-[#6b675c] focus:outline-none focus:border-red-500 leading-relaxed transition-all resize-y"
                />
                <div className="flex items-center justify-between text-[10px] text-[#8c887b] px-1">
                  <span>სიტყვების რაოდენობა: {wordCount}</span>
                  <span>ავტო-შენახვა ჩართულია 💾</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEvaluate(q)}
                    disabled={isLoading || (!userAnswer.trim() && q.type !== 'table')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>AI აანალიზებს...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{evalResult ? 'ხელახლა შეფასება' : 'შეამოწმე AI-ით'}</span>
                      </>
                    )}
                  </button>

                  {userAnswer && (
                    <button
                      onClick={() => handleResetAnswer(q.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#b8b5a8] hover:text-white transition-all cursor-pointer"
                      title="პასუხის გასუფთავება"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    soundEffects.click();
                    setExpandedKeys(prev => ({ ...prev, [q.id]: !prev[q.id] }));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#b8b5a8] hover:text-[#fcfbf7] transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>სანიმუშო პასუხი &amp; კრიტერიუმები</span>
                  {isKeyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Evaluation Feedback Panel */}
              <AnimatePresence>
                {evalResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
                      evalResult.status === 'correct'
                        ? 'bg-emerald-950/25 border-emerald-500/30'
                        : evalResult.status === 'partial'
                        ? 'bg-amber-950/25 border-amber-500/30'
                        : 'bg-red-950/25 border-red-500/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        {evalResult.status === 'correct' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-xs font-bold text-[#fcfbf7]">
                          {evalResult.status === 'correct'
                            ? '🎉 სრულყოფილი პასუხი'
                            : evalResult.status === 'partial'
                            ? '⚡ ნაწილობრივ სწორი პასუხი'
                            : '📖 პასუხი საჭიროებს დახვეწას'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[#b8b5a8]">
                        <span className="font-mono font-bold text-amber-300">
                          {evalResult.score} / {evalResult.maxScore} ქულა
                        </span>
                        <span>•</span>
                        <span>
                          {evalResult.evaluator === 'gemini' ? 'Gemini AI ექსპერტი' : 'სემანტიკური AI'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#e6e2d3] leading-relaxed">
                      {evalResult.feedback}
                    </p>

                    {evalResult.keyPointsCovered.length > 0 && (
                      <div className="text-[11px] text-emerald-300 space-y-1 pt-1">
                        <strong className="block text-emerald-400">✓ სწორად გააზრებული საკითხები:</strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-[#d4d1c5]">
                          {evalResult.keyPointsCovered.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expandable Model Answer & Criteria Accordion */}
              <AnimatePresence>
                {isKeyExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#12131d] border border-[#f5f2eb]/10 space-y-2 text-xs"
                  >
                    <div className="text-amber-300 font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>სანიმუშო პასუხი (მასწავლებლის გასაღები):</span>
                    </div>
                    <p className="text-[#dedacb] leading-relaxed p-2.5 rounded-xl bg-[#181928] border border-[#f5f2eb]/5">
                      {q.sampleAnswer}
                    </p>

                    <div className="pt-1.5 space-y-1">
                      <strong className="text-[11px] text-[#a8a495] block">შეფასების კრიტერიუმები:</strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#b8b5a8]">
                        {q.criteria.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
