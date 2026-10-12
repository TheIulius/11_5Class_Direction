import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects';

interface Ilo777ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REEL_SYMBOLS = ['7️⃣', '⚡', '☕', '🚀', '💻', '🎰', '🎓', '💎'];

export const Ilo777Modal: React.FC<Ilo777ModalProps> = ({ isOpen, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<[string, string, string]>(['7️⃣', '7️⃣', '7️⃣']);
  const [hasWon, setHasWon] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState(777000);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      triggerConfetti();
      soundEffects.jackpot();
      setHasWon(true);
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
    } catch {
      // Fallback
    }
  };

  const spinReels = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasWon(false);

    let counter = 0;
    const interval = setInterval(() => {
      soundEffects.reelTick();
      setReels([
        REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)],
        REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)],
        REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)]
      ]);
      counter++;

      if (counter > 14) {
        clearInterval(interval);
        setReels(['7️⃣', '7️⃣', '7️⃣']);
        setIsSpinning(false);
        setHasWon(true);
        setTreasuryBalance(prev => prev + 77777);
        soundEffects.jackpot();
        triggerConfetti();
      }
    }, 80);
  };

  const copyCampaignMeme = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `🎰 11/5 Direction: Just unlocked 777,777 GEL in campaign funding via ilo777slots! 100% Quiz Exemption & 0 Homeroom Speeches. Vote 11/5 Direction!`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-[#131420]/95 backdrop-blur-2xl border border-[#f5f2eb]/20 rounded-3xl p-5 text-white shadow-2xl z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold tracking-tight text-[#fcfbf7]">
                  ilo777slots &bull; კამპანიის სალარო
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Jackpot Counter */}
            <div className="flex items-center justify-between text-xs px-1 text-[#b8b5a8] font-mono">
              <span>სალაროს ბალანსი:</span>
              <span className="text-amber-400 font-bold font-mono">
                ₾ {treasuryBalance.toLocaleString()} GEL
              </span>
            </div>

            {/* Slot Reels */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-3">
              <div className="grid grid-cols-3 gap-2">
                {reels.map((symbol, idx) => (
                  <div
                    key={idx}
                    className={`h-20 rounded-xl bg-white/5 border ${
                      hasWon ? 'border-amber-400/50' : 'border-white/5'
                    } flex items-center justify-center text-3xl select-none transition-all`}
                  >
                    <span>{symbol}</span>
                  </div>
                ))}
              </div>

              <div className="text-center mt-2.5 text-xs font-mono">
                {isSpinning ? (
                  <span className="text-[#a8a495]">ტრიალებს...</span>
                ) : hasWon ? (
                  <span className="text-amber-400 font-semibold">ჯექპოტი: 777 დაჯდა!</span>
                ) : (
                  <span className="text-[#78756c]">მზადაა</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={spinReels}
                disabled={isSpinning}
                className="flex-1 py-2.5 rounded-xl bg-[#f5f2eb] hover:bg-white active:bg-[#e8e4d8] disabled:opacity-50 text-[#0c0d12] font-semibold text-xs transition-colors cursor-pointer shadow-md"
              >
                {isSpinning ? 'დატრიალება...' : 'დაატრიალე 🎰'}
              </button>

              <button
                onClick={copyCampaignMeme}
                className="px-3.5 py-2.5 rounded-xl border border-[#f5f2eb]/20 bg-[#f5f2eb]/10 hover:bg-[#f5f2eb]/20 text-xs font-medium text-[#fcfbf7] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'დაკოპირდა' : 'გაზიარება'}</span>
              </button>
            </div>

            {/* Meme Quote */}
            <div className="text-center text-[10px] text-[#a8a495] font-mono">
              ilo777 says: &quot;ძმაო, 777 დაჯდა, 11/5 Direction იმარჯვებს!&quot;
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
