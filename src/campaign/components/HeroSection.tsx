import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Compass, MessageSquare, Rocket } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface HeroSectionProps {
  onNavigateTab: (tab: 'calendar' | 'homework' | 'opportunities' | 'ideas' | 'clubs') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateTab }) => {
  return (
    <section className="pt-10 sm:pt-16 pb-12 sm:pb-16 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
      {/* Top Subtle Pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#f5f2eb]/15 bg-[#171825]/60 text-xs font-mono text-[#dedacb] backdrop-blur-xl shadow-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#f5f2eb] animate-pulse" />
        <span>11/5 DIRECTION &bull; საპრეზიდენტო პლატფორმა 2026</span>
      </motion.div>

      {/* Main Title */}
      <div className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#fcfbf7] uppercase"
        >
          11/5 DIRECTION
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-[#c5c1b2] max-w-xl mx-auto font-normal leading-relaxed"
        >
          მე-11 კლასის თვითმმართველობის საინფორმაციო და აკადემიური პორტალი.
        </motion.p>
      </div>

      {/* Primary Action Pills */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-3 pt-2"
      >
        <button
          onClick={() => {
            soundEffects.click();
            onNavigateTab('calendar');
          }}
          className="px-5 py-2.5 rounded-xl bg-[#f5f2eb] hover:bg-white active:bg-[#e8e4d8] text-[#0c0d12] font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-[#0c0d12]" />
          <span>კალენდრის გახსნა</span>
        </button>

        <button
          onClick={() => {
            soundEffects.click();
            onNavigateTab('homework');
          }}
          className="px-5 py-2.5 rounded-xl border border-[#f5f2eb]/20 bg-[#171826]/70 hover:bg-[#202235]/80 text-[#fcfbf7] font-semibold text-xs sm:text-sm backdrop-blur-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-[#dedacb]" />
          <span>დავალებები &amp; ცხრილი</span>
        </button>

        <button
          onClick={() => {
            soundEffects.click();
            onNavigateTab('opportunities');
          }}
          className="px-4 py-2.5 rounded-xl border border-[#f5f2eb]/15 bg-white/5 hover:bg-white/10 text-[#d4d1c5] font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <Compass className="w-4 h-4 text-[#a8a495]" />
          <span>ალუმნები</span>
        </button>

        <button
          onClick={() => {
            soundEffects.click();
            onNavigateTab('ideas');
          }}
          className="px-4 py-2.5 rounded-xl border border-[#f5f2eb]/15 bg-white/5 hover:bg-white/10 text-[#d4d1c5] font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-[#a8a495]" />
          <span>იდეების დაფა</span>
        </button>
      </motion.div>

      {/* Feature Pillar Highlights with Multi-shade Frosted Glass Containers */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 text-left"
      >
        {/* Container Shade 1 */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="p-5 rounded-2xl bg-[#141522]/80 hover:bg-[#1a1c2d]/90 border border-[#f5f2eb]/10 backdrop-blur-xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-[#f5f2eb]/10 flex items-center justify-center text-[#fcfbf7] mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#fcfbf7] group-hover:text-white transition-colors">
            ჭკვიანი კალენდარი
          </h3>
          <p className="text-xs text-[#a8a495] mt-1.5 leading-relaxed">
            შემაჯამებლები, დამოუკიდებლები, გამოკითხვები და ჩემპიონატები AI შეფასებით.
          </p>
        </div>

        {/* Container Shade 2 */}
        <div
          onClick={() => onNavigateTab('homework')}
          className="p-5 rounded-2xl bg-[#181928]/70 hover:bg-[#202235]/85 border border-[#f5f2eb]/12 backdrop-blur-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-[#f5f2eb]/10 flex items-center justify-center text-[#fcfbf7] mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#fcfbf7] group-hover:text-white transition-colors">
            დავალებები &amp; ცხრილი
          </h3>
          <p className="text-xs text-[#a8a495] mt-1.5 leading-relaxed">
            13 ოქტ: მათემატიკა 54-60 (ნ. ჯაფარიძე) და გაკვეთილების ყოველკვირეული განრიგი.
          </p>
        </div>

        {/* Container Shade 3 */}
        <div
          onClick={() => onNavigateTab('opportunities')}
          className="p-5 rounded-2xl bg-[#1d1f30]/60 hover:bg-[#25283e]/80 border border-[#f5f2eb]/15 backdrop-blur-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-[#f5f2eb]/10 flex items-center justify-center text-[#fcfbf7] mb-3 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#fcfbf7] group-hover:text-white transition-colors">
            ალუმნების ჰაბი
          </h3>
          <p className="text-xs text-[#a8a495] mt-1.5 leading-relaxed">
            გვანცა ხვედელიძე (Constructor) და ლუკა მოსიაშვილი (Vanderbilt).
          </p>
        </div>

        {/* Container Shade 4 */}
        <div
          onClick={() => onNavigateTab('clubs')}
          className="p-5 rounded-2xl bg-[#222438]/50 hover:bg-[#2a2d46]/70 border border-[#f5f2eb]/18 backdrop-blur-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-[#f5f2eb]/10 flex items-center justify-center text-[#fcfbf7] mb-3 group-hover:scale-105 transition-transform">
            <Rocket className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#fcfbf7] group-hover:text-white transition-colors">
            კლუბების "მწვანე შუქი"
          </h3>
          <p className="text-xs text-[#a8a495] mt-1.5 leading-relaxed">
            სასკოლო კლუბების სწრაფი დამტკიცება და სივრცის დაჯავშნა.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
