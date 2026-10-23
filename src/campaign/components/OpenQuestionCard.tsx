import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Copy,
  X
} from 'lucide-react';
import {
  OpenQuestionItem,
  EvaluationResult,
  evaluateOpenAnswer
} from '../data/testsData';
import { soundEffects } from '../utils/soundEffects';

interface OpenQuestionCardProps {
  question: OpenQuestionItem;
  orderNum?: number;
  compact?: boolean;
}

export const OpenQuestionCard: React.FC<OpenQuestionCardProps> = ({
  question,
  orderNum
}) => {
  const [answer, setAnswer] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`11_5_open_ans_${question.id}`) || '';
    } catch {
      return '';
    }
  });

  const [tableAnswers, setTableAnswers] = useState<{ example: string; effect: string }[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`11_5_open_table_${question.topicId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[question.id] || [];
      }
    } catch {}
    return [];
  });

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`11_5_open_eval_${question.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  // Sync on question.id change (in 1-card mode)
  useEffect(() => {
    try {
      setAnswer(localStorage.getItem(`11_5_open_ans_${question.id}`) || '');
      const savedEval = localStorage.getItem(`11_5_open_eval_${question.id}`);
      setEvaluation(savedEval ? JSON.parse(savedEval) : null);

      const savedTable = localStorage.getItem(`11_5_open_table_${question.topicId}`);
      if (savedTable) {
        const parsed = JSON.parse(savedTable);
        setTableAnswers(parsed[question.id] || []);
      } else {
        setTableAnswers([]);
      }
    } catch {}
  }, [question.id, question.topicId]);

  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    try {
      localStorage.setItem(`11_5_open_ans_${question.id}`, val);
    } catch {}
  };

  const handleTableChange = (rowIndex: number, field: 'example' | 'effect', val: string) => {
    const currentRows = [...tableAnswers];
    while (currentRows.length <= rowIndex) {
      currentRows.push({ example: '', effect: '' });
    }
    currentRows[rowIndex] = { ...currentRows[rowIndex], [field]: val };
    setTableAnswers(currentRows);

    try {
      const fullSaved = localStorage.getItem(`11_5_open_table_${question.topicId}`);
      const tableData = fullSaved ? JSON.parse(fullSaved) : {};
      tableData[question.id] = currentRows;
      localStorage.setItem(`11_5_open_table_${question.topicId}`, JSON.stringify(tableData));
    } catch {}
  };

  const handleEvaluate = async () => {
    soundEffects.click();
    let textToEvaluate = answer;

    if (question.type === 'table') {
      const tableTextParts = (question.tableRows || []).map((r, i) => {
        const userRow = tableAnswers[i] || { example: '', effect: '' };
        return `${r.device}: მაგალითი - "${userRow.example}"; დანიშნულება - "${userRow.effect}"`;
      });
      textToEvaluate = tableTextParts.join('\n');
      if (!answer) {
        handleAnswerChange(textToEvaluate);
      }
    }

    setIsLoading(true);

    try {
      const result = await evaluateOpenAnswer(question, textToEvaluate);
      setEvaluation(result);
      try {
        localStorage.setItem(`11_5_open_eval_${question.id}`, JSON.stringify(result));
      } catch {}

      if (result.status === 'correct') {
        soundEffects.success();
      } else {
        soundEffects.click();
      }
    } catch (err) {
      console.error('[OpenQuestionCard] Evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAnswer = () => {
    soundEffects.click();
    setAnswer('');
    setTableAnswers([]);
    setEvaluation(null);
    try {
      localStorage.removeItem(`11_5_open_ans_${question.id}`);
      localStorage.removeItem(`11_5_open_eval_${question.id}`);
      const fullSaved = localStorage.getItem(`11_5_open_table_${question.topicId}`);
      if (fullSaved) {
        const tableData = JSON.parse(fullSaved);
        delete tableData[question.id];
        localStorage.setItem(`11_5_open_table_${question.topicId}`, JSON.stringify(tableData));
      }
    } catch {}
  };

  const handleCopySample = () => {
    soundEffects.click();
    if (question.sampleAnswer) {
      navigator.clipboard.writeText(question.sampleAnswer);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2000);
    }
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const displayNumber = orderNum !== undefined ? orderNum : question.numberLabel;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#181928] border border-[#f5f2eb]/12 space-y-3.5 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f5f2eb]/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 text-[10.5px] font-mono font-bold flex items-center gap-1.5">
            <PenTool className="w-3 h-3 text-red-400" />
            <span>#{displayNumber} &bull; ღია დავალება</span>
          </span>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#c5c1b2] border border-[#f5f2eb]/10">
            {question.type === 'narrative'
              ? 'სამსჯელო'
              : question.type === 'reflection'
              ? 'რეფლექსია'
              : question.type === 'table'
              ? 'ცხრილი'
              : 'მოკლე პასუხი'}
          </span>

          <span className="text-xs font-bold text-[#fcfbf7]">
            {question.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
            მაქს. {question.points} ქულა
          </span>

          {evaluation && (
            <span
              className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                evaluation.status === 'correct'
                  ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300'
                  : evaluation.status === 'partial'
                  ? 'bg-amber-500/20 border-amber-500/35 text-amber-300'
                  : 'bg-red-500/20 border-red-500/35 text-red-300'
              }`}
            >
              <Award className="w-3 h-3" />
              {evaluation.score} / {evaluation.maxScore} ქულა
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="text-xs sm:text-sm font-bold text-[#fcfbf7] leading-relaxed">
        {question.question}
      </div>

      {/* Table Input for Table Questions */}
      {question.type === 'table' && question.tableRows && (
        <div className="space-y-2 pt-1 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse border border-[#f5f2eb]/15 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-[#141522] text-[#d4d1c5]">
                <th className="border border-[#f5f2eb]/15 p-2 text-left w-1/4">მხატვრული ხერხი</th>
                <th className="border border-[#f5f2eb]/15 p-2 text-left w-3/8">მაგალითი ლექსიდან</th>
                <th className="border border-[#f5f2eb]/15 p-2 text-left w-3/8">დანიშნულება / ეფექტი</th>
              </tr>
            </thead>
            <tbody>
              {question.tableRows.map((row, rIdx) => {
                const userRow = tableAnswers[rIdx] || { example: '', effect: '' };
                return (
                  <tr key={rIdx} className="bg-[#12131d]/90">
                    <td className="border border-[#f5f2eb]/15 p-2 font-bold text-red-300">
                      {row.device}
                    </td>
                    <td className="border border-[#f5f2eb]/15 p-1.5">
                      <input
                        type="text"
                        value={userRow.example}
                        onChange={e => handleTableChange(rIdx, 'example', e.target.value)}
                        placeholder="მაგალითი ტექსტიდან..."
                        className="w-full px-2 py-1.5 rounded-lg bg-[#181928] border border-[#f5f2eb]/10 text-xs text-[#fcfbf7] placeholder-[#6b675c] focus:outline-none focus:border-red-500"
                      />
                    </td>
                    <td className="border border-[#f5f2eb]/15 p-1.5">
                      <input
                        type="text"
                        value={userRow.effect}
                        onChange={e => handleTableChange(rIdx, 'effect', e.target.value)}
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

      {/* Textarea Input */}
      <div className="space-y-1.5">
        <textarea
          value={answer}
          onChange={e => handleAnswerChange(e.target.value)}
          placeholder={
            question.type === 'table'
              ? 'შეგიძლიათ დაამატოთ დამატებითი კომენტარი ან შეავსოთ ზემოთ მოცემული ცხრილი...'
              : 'ჩაწერეთ თქვენი პასუხი აქ (დაფიქრდით ტექსტის შინაარსზე, მხატვრულ ხერხებზე და მოიყვანეთ არგუმენტები)...'
          }
          rows={question.type === 'reflection' ? 4 : 3}
          className="w-full p-3 rounded-xl bg-[#12131d]/95 border border-[#f5f2eb]/15 text-xs sm:text-sm text-[#fcfbf7] placeholder-[#6b675c] focus:outline-none focus:border-red-500 leading-relaxed transition-all resize-y"
        />
        <div className="flex items-center justify-between text-[10px] text-[#8c887b] px-1">
          <span>სიტყვების რაოდენობა: {wordCount}</span>
          <span>ავტო-დამახსოვრება ბრაუზერში 💾</span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            disabled={isLoading || (!answer.trim() && question.type !== 'table')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI აანალიზებს...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{evaluation ? 'ხელახლა შეფასება' : 'შეამოწმე AI-ით'}</span>
              </>
            )}
          </button>

          {answer && (
            <button
              onClick={handleResetAnswer}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#b8b5a8] hover:text-white transition-all cursor-pointer"
              title="პასუხის გასუფთავება"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundEffects.click();
              setIsCriteriaOpen(prev => !prev);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-[#f5f2eb]/10 text-[11px] text-[#dedacb] transition-all cursor-pointer"
          >
            <span>რუბრიკა</span>
            {isCriteriaOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {question.sampleAnswer && (
            <button
              onClick={() => {
                soundEffects.click();
                setIsSampleOpen(prev => !prev);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[11px] text-emerald-300 font-bold transition-all cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>სანიმუშო</span>
              {isSampleOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* AI Evaluation Box */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
            evaluation.status === 'correct'
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : evaluation.status === 'partial'
              ? 'bg-amber-950/40 border-amber-500/40'
              : 'bg-red-950/40 border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5 text-white">
              {evaluation.status === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {evaluation.status === 'partial' && <AlertCircle className="w-4 h-4 text-amber-400" />}
              {evaluation.status === 'needs_work' && <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>AI შეფასების შედეგი:</span>
            </span>

            <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-black/40 text-[#fcfbf7]">
              {evaluation.score} / {evaluation.maxScore} ქულა
            </span>
          </div>

          <p className="text-[11px] text-[#dedacb] leading-relaxed">
            {evaluation.feedback}
          </p>

          {evaluation.keyPointsCovered && evaluation.keyPointsCovered.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-white/10 text-[11px]">
              <strong className="text-emerald-400 block text-[10px]">✓ სწორად გააზრებული საკითხები:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[#d4d1c5]">
                {evaluation.keyPointsCovered.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-white/10 text-[11px]">
              <strong className="text-amber-400 block text-[10px]">⚡ დასახვეწი / გასათვალისწინებელი:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[#d4d1c5]">
                {evaluation.missingPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Criteria Accordion */}
      <AnimatePresence>
        {isCriteriaOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-white/5 border border-[#f5f2eb]/10 space-y-2 text-[11px] text-[#d4d1c5]"
          >
            <strong className="text-amber-300 block">შეფასების ოფიციალური კრიტერიუმები:</strong>
            <ul className="space-y-1 list-disc list-inside">
              {question.criteria.map((c, i) => (
                <li key={i} className="leading-relaxed">{c}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample Answer Accordion */}
      <AnimatePresence>
        {isSampleOpen && question.sampleAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-[11px]"
          >
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300">ოფიციალური სანიმუშო პასუხი:</strong>
              <button
                onClick={handleCopySample}
                className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-200 cursor-pointer"
              >
                {copiedSample ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSample ? 'კოპირებულია' : 'კოპირება'}</span>
              </button>
            </div>
            <p className="text-[#fcfbf7] leading-relaxed italic bg-black/20 p-2.5 rounded-lg border border-emerald-500/20">
              „{question.sampleAnswer}“
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
