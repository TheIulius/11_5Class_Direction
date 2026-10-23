import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  X,
  Eye,
  Flame,
  CheckCircle2,
  PenTool,
  Headphones,
  Video,
  Clock,
  Layers,
  Award,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileText,
  Percent
} from 'lucide-react';
import { usePlatformAnalytics, refreshAnalytics } from '../services/analytics';
import { soundEffects } from '../utils/soundEffects';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const stats = usePlatformAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleManualRefresh = async () => {
    soundEffects.click();
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const accuracyPercent =
    stats.tests.totalAnswered > 0
      ? Math.round((stats.tests.correctAnswers / stats.tests.totalAnswered) * 100)
      : 0;

  const podcastCompletionRate =
    stats.podcastStats.totalPlays > 0
      ? Math.round((stats.podcastStats.totalCompletes / stats.podcastStats.totalPlays) * 100)
      : 0;

  const videoCompletionRate =
    stats.videoStats.totalPlays > 0
      ? Math.round((stats.videoStats.totalCompletes / stats.videoStats.totalPlays) * 100)
      : 0;

  const tabNames: Record<string, string> = {
    overview: '🎬 ვიდეო & მიმოხილვა',
    poem: '📖 ლექსი & ლექსიკონი',
    analysis: '🔍 ანალიზი & სტროფები',
    quiz: '✍️ ტესტი & ღია კითხვები',
    open: '📝 ღია ჩასაწერი',
    flashcards: '⚡ ბარათები'
  };

  const topicNames: Record<string, string> = {
    'edemi': '1. დაკარგული ედემი',
    'visac-gsurt': '2. ვისაც გსურთ',
    'vah-droni': '3. ვაჰ, დრონი, დრონი',
    'gogcha': '4. გოგჩა',
    'sagamo': '5. საღამო გამოსალმებისა',
    'tamar-mefe': '6. თამარ მეფის სახე'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#141522] border border-[#f5f2eb]/20 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#f5f2eb]/10 flex items-center justify-between gap-3 bg-[#181928]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#fcfbf7]">
                  პლატფორმის ლაივ ანალიტიკა
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[#b8b5a8]">
                სრული მონაცემები: ტაბების ნახვები, ტესტები, ღია პასუხების ხარისხი და მოსმენის დონე
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#d4d1c5] hover:text-white transition-all cursor-pointer"
              title="მონაცემების განახლება"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundEffects.click();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#d4d1c5] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-[#fcfbf7]">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Visits */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181928] border border-stone-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-sky-400">
                <Eye className="w-4 h-4" />
                <span className="text-[10px] font-mono text-[#a8a495]">საიტი</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono">
                {stats.visits.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#b8b5a8]">ჯამური ვიზიტები</div>
            </div>

            {/* 2. Quiz Views */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181928] border border-red-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-red-400">
                <Flame className="w-4 h-4" />
                <span className="text-[10px] font-mono text-red-300">ქვიზი</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-red-200">
                {stats.quizClicks.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#b8b5a8]">„ქვიზი“-ს გახსნა</div>
            </div>

            {/* 3. Tests Answered */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181928] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-mono text-amber-300">{accuracyPercent}% სწორი</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-200">
                {stats.tests.totalAnswered}
              </div>
              <div className="text-[11px] text-[#b8b5a8]">ამოხსნილი ტესტური</div>
            </div>

            {/* 4. Open Questions */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181928] border border-purple-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-purple-400">
                <PenTool className="w-4 h-4" />
                <span className="text-[10px] font-mono text-purple-300">~{stats.openQuestions.averageWordCount} სიტყვა</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-200">
                {stats.openQuestions.totalSubmitted}
              </div>
              <div className="text-[11px] text-[#b8b5a8]">ღია დავალებები</div>
            </div>
          </div>

          {/* Section 1: Open Written Questions Analysis (ღია კითხვები ჩაწერეს თუ არა მართლა) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#181928]/80 border border-[#f5f2eb]/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-[#fcfbf7]">
                  ღია ჩასაწერი დავალებების რეალური შემოწმება
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#b8b5a8]">
                სიტყვების ანალიზი &amp; AI
              </span>
            </div>

            <p className="text-xs text-[#b8b5a8] leading-relaxed">
              მონაცემები ამოწმებს, ჩაწერეს თუ არა მოსწავლეებმა რეალური, შინაარსიანი პასუხები (10-ზე მეტი სიტყვა), თუ მხოლოდ ფიქტიური დაჭერები იყო.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-[#12131d] border border-purple-500/20">
                <div className="text-[10px] text-[#a8a495]">შინაარსიანი პასუხები (&ge;10 სიტყვა):</div>
                <div className="text-lg font-mono font-bold text-emerald-300 mt-1">
                  {stats.openQuestions.meaningfulSubmissions} / {stats.openQuestions.totalSubmitted}
                </div>
                <div className="text-[10px] text-[#b8b5a8] mt-0.5">
                  {stats.openQuestions.totalSubmitted > 0
                    ? `${Math.round((stats.openQuestions.meaningfulSubmissions / stats.openQuestions.totalSubmitted) * 100)}% ნამდვილი პასუხი`
                    : 'მონაცემი გროვდება'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#12131d] border border-purple-500/20">
                <div className="text-[10px] text-[#a8a495]">საშუალო მოცულობა:</div>
                <div className="text-lg font-mono font-bold text-purple-300 mt-1">
                  {stats.openQuestions.averageWordCount} სიტყვა
                </div>
                <div className="text-[10px] text-[#b8b5a8] mt-0.5">
                  სულ ჩაწერილია {stats.openQuestions.totalWords} სიტყვა
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#12131d] border border-purple-500/20">
                <div className="text-[10px] text-[#a8a495]">AI შეფასებების შედეგები:</div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono font-bold">
                  <span className="text-emerald-400">✓ {stats.openQuestions.statusBreakdown?.correct || 0}</span>
                  <span className="text-amber-400">⚡ {stats.openQuestions.statusBreakdown?.partial || 0}</span>
                  <span className="text-red-400">✕ {stats.openQuestions.statusBreakdown?.needs_work || 0}</span>
                </div>
                <div className="text-[10px] text-[#b8b5a8] mt-0.5">
                  სრული • ნაწილობრივი • დასახვეწი
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Audio & Video Listening / Watching Analytics (ბოლომდე მოუსმინეს თუ არა) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Podcast Listening Stats */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#181928]/80 border border-red-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-red-400" />
                  <h4 className="text-sm font-bold text-[#fcfbf7]">
                    2-წამყვანიანი პოდკასტი (აუდიო)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-red-300">
                  {podcastCompletionRate}% ბოლომდე
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#12131d] border border-[#f5f2eb]/5">
                  <span className="text-[10px] text-[#a8a495] block">ჩართვების რაოდენობა:</span>
                  <span className="font-mono font-bold text-sm text-[#fcfbf7]">
                    {stats.podcastStats.totalPlays}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#12131d] border border-[#f5f2eb]/5">
                  <span className="text-[10px] text-[#a8a495] block">საშუალო მოსმენის დრო:</span>
                  <span className="font-mono font-bold text-sm text-amber-300">
                    {stats.podcastStats.averageSeconds} წმ
                  </span>
                </div>
              </div>

              {/* Milestones bar */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#a8a495] block">მოსმენის ეტაპები (Milestones):</span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">25%</span>
                    <span className="font-bold text-white">{stats.podcastStats.milestones?.reached25 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">50%</span>
                    <span className="font-bold text-white">{stats.podcastStats.milestones?.reached50 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">75%</span>
                    <span className="font-bold text-white">{stats.podcastStats.milestones?.reached75 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                    <span className="text-emerald-300 block">100% ✓</span>
                    <span className="font-bold text-emerald-200">{stats.podcastStats.totalCompletes}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Overviews Stats */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#181928]/80 border border-sky-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-400" />
                  <h4 className="text-sm font-bold text-[#fcfbf7]">
                    ვიდეო მიმოხილვები (NotebookLM)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-sky-300">
                  {videoCompletionRate}% ბოლომდე
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#12131d] border border-[#f5f2eb]/5">
                  <span className="text-[10px] text-[#a8a495] block">ჩართვების რაოდენობა:</span>
                  <span className="font-mono font-bold text-sm text-[#fcfbf7]">
                    {stats.videoStats.totalPlays}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#12131d] border border-[#f5f2eb]/5">
                  <span className="text-[10px] text-[#a8a495] block">საშუალო ყურების დრო:</span>
                  <span className="font-mono font-bold text-sm text-sky-300">
                    {stats.videoStats.averageSeconds} წმ
                  </span>
                </div>
              </div>

              {/* Milestones bar */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#a8a495] block">ყურების ეტაპები (Milestones):</span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">25%</span>
                    <span className="font-bold text-white">{stats.videoStats.milestones?.reached25 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">50%</span>
                    <span className="font-bold text-white">{stats.videoStats.milestones?.reached50 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[#a8a495] block">75%</span>
                    <span className="font-bold text-white">{stats.videoStats.milestones?.reached75 || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                    <span className="text-emerald-300 block">100% ✓</span>
                    <span className="font-bold text-emerald-200">{stats.videoStats.totalCompletes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Studio Tab Clicks Breakdown */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#181928]/80 border border-[#f5f2eb]/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-[#fcfbf7]">
                  სტუდიის ტაბების პოპულარობა (დაჭერების რაოდენობა)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#b8b5a8]">
                აქტივობის გადანაწილება
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {Object.entries(tabNames).map(([key, label]) => {
                const count = stats.tabClicks?.[key] || 0;
                return (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-[#12131d] border border-[#f5f2eb]/5 flex items-center justify-between"
                  >
                    <span className="text-xs text-[#d4d1c5] truncate pr-2">{label}</span>
                    <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Topic / Poem Popularity */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#181928]/80 border border-[#f5f2eb]/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-[#fcfbf7]">
                  თემების &amp; ლექსების ნახვები
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#b8b5a8]">
                რომელ ლექსზე ჩერდებიან ყველაზე მეტად
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {Object.entries(topicNames).map(([key, label]) => {
                const count = stats.topicViews?.[key] || 0;
                return (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-[#12131d] border border-[#f5f2eb]/5 flex items-center justify-between"
                  >
                    <span className="text-xs text-[#d4d1c5] truncate pr-2">{label}</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#f5f2eb]/10 bg-[#181928]/90 flex items-center justify-between text-xs text-[#a8a495]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>მონაცემები ინახება და სინქრონიზდება ავტომატურად GitHub-ზე</span>
          </div>

          <button
            onClick={() => {
              soundEffects.click();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            დახურვა
          </button>
        </div>
      </motion.div>
    </div>
  );
};
