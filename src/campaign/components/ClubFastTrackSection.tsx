import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Rocket, Copy, X } from 'lucide-react';
import { INITIAL_GREEN_LIGHT_CLUBS, GreenLightClub } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';

export const ClubFastTrackSection: React.FC = () => {
  const [clubs, setClubs] = useState<GreenLightClub[]>(INITIAL_GREEN_LIGHT_CLUBS);
  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState('ტექნოლოგიები');
  const [clubRoom, setClubRoom] = useState('ოთახი 304');
  const [activeCharter, setActiveCharter] = useState<GreenLightClub | null>(null);
  const [copied, setCopied] = useState(false);

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;
    soundEffects.success();

    const created: GreenLightClub = {
      id: `club-${Date.now()}`,
      name: clubName.trim(),
      category: clubCategory,
      lead: 'თქვენ და კლასელები',
      room: clubRoom,
      summary: `დამტკიცებულია ${clubRoom}-ის გამოყენება 11/5 Platform-ის წესდებით.`,
      charterId: `CHARTER-2026-${Math.floor(100 + Math.random() * 900)}`
    };

    setClubs([created, ...clubs]);
    setActiveCharter(created);
    setClubName('');
  };

  const handleCopy = () => {
    if (!activeCharter) return;
    soundEffects.click();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `11/5 Platform კლუბის წესდება: ${activeCharter.name} (დამტკიცებულია ${activeCharter.room}-ში) - ტოკენი: ${activeCharter.charterId}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="clubs" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Section Header */}
      <div>
        <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1.5 opacity-80">
          სასკოლო ინიციატივები &bull; 11/5 <span className="text-[9px] font-normal lowercase opacity-75 mx-0.5">class</span> PLATFORM
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
          კლუბების სწრაფი დამტკიცება (&quot;მწვანე შუქი&quot;)
        </h2>
        <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
          პირდაპირი კომუნიკაცია თვითმმართველობასთან — ახალი კლუბების დამტკიცება და სივრცის დაჯავშნა ბიუროკრატიული შეფერხებების გარეშე.
        </p>
      </div>

      {/* Comparison Grid with Multi-Shade Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Old Process */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#141520]/60 backdrop-blur-xl text-xs space-y-2">
          <span className="font-mono text-[#a8a495] font-semibold uppercase text-[11px] block">
            ძველი ბიუროკრატიული სისტემა
          </span>
          <ul className="space-y-1.5 text-[#b8b5a8]">
            <li>&bull; 21 სამუშაო დღე განხილვისთვის</li>
            <li>&bull; 5 სხვადასხვა ხელმოწერა</li>
            <li>&bull; გაურკვევლობა ოთახების განაწილებაზე</li>
          </ul>
        </div>

        {/* Green Light */}
        <div className="p-5 rounded-2xl border border-[#f5f2eb]/20 bg-[#181926]/80 backdrop-blur-xl text-xs space-y-2 shadow-lg">
          <span className="font-mono text-[#fcfbf7] font-semibold uppercase text-[11px] block">
            "მწვანე შუქის" პროტოკოლი
          </span>
          <ul className="space-y-1.5 text-[#dedacb]">
            <li>&bull; მყისიერი დამტკიცება და კოორდინაცია</li>
            <li>&bull; ოთახებისა და სივრცეების ოფიციალური დაჯავშნა</li>
            <li>&bull; საპრეზიდენტო წესდების ტოკენი</li>
          </ul>
        </div>
      </div>

      {/* Club Application Form */}
      <div className="border border-[#f5f2eb]/12 bg-[#141522]/80 backdrop-blur-2xl rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">ახალი კლუბის დარეგისტრირება</h3>
        <form onSubmit={handleMint} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={clubName}
            onChange={e => setClubName(e.target.value)}
            placeholder="კლუბის სახელი (მაგ. AI გილდია)"
            className="bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40"
          />
          <select
            value={clubCategory}
            onChange={e => setClubCategory(e.target.value)}
            className="bg-[#181926] border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5f2eb]/40"
          >
            <option value="ტექნოლოგიები">ტექნოლოგიები &amp; AI</option>
            <option value="მეცნიერება & დებატები">მეცნიერება &amp; დებატები</option>
            <option value="ხელოვნება & კულტურა">ხელოვნება &amp; კულტურა</option>
            <option value="ლოგიკა & სპორტი">ლოგიკა &amp; სპორტი</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#f5f2eb] hover:bg-white text-xs font-semibold text-[#0c0d12] transition-colors cursor-pointer"
          >
            კლუბის დადასტურება
          </button>
        </form>
      </div>

      {/* Operational Clubs */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase text-[#a8a495] font-semibold block">
          აქტიური კლუბები სკოლაში
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {clubs.map(club => (
            <div
              key={club.id}
              className="border border-[#f5f2eb]/10 bg-[#161724]/70 backdrop-blur-xl p-4 rounded-2xl space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[#a8a495]">
                <span>{club.category}</span>
                <span className="text-emerald-400">აქტიური</span>
              </div>
              <div className="font-semibold text-white leading-snug">{club.name}</div>
              <div className="text-[#b8b5a8] text-[11px] font-mono">{club.room}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charter Modal */}
      <AnimatePresence>
        {activeCharter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCharter(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#131420] border border-[#f5f2eb]/20 rounded-2xl p-6 z-10 text-[#f5f2eb] space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#dedacb]">
                  11/5 <span className="text-[9px] opacity-75 mx-0.5">class</span> Platform წესდება
                </span>
                <button
                  onClick={() => setActiveCharter(null)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs space-y-2">
                <div className="flex justify-between text-[#a8a495]">
                  <span>ID:</span>
                  <span className="text-white font-medium">{activeCharter.charterId}</span>
                </div>
                <div className="flex justify-between gap-2 text-[#a8a495]">
                  <span>კლუბი:</span>
                  <span className="text-white font-medium text-right">
                    {activeCharter.name}
                  </span>
                </div>
                <div className="flex justify-between text-[#a8a495]">
                  <span>სივრცე:</span>
                  <span className="text-white font-medium">{activeCharter.room}</span>
                </div>
                <div className="flex justify-between text-[#a8a495]">
                  <span>სტატუსი:</span>
                  <span className="text-emerald-400 font-medium">დამტკიცებულია</span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl bg-[#f5f2eb] hover:bg-white text-xs font-semibold text-[#0c0d12] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'დაკოპირდა' : 'წესდების კოდის კოპირება'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
