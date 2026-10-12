import React, { useMemo } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface ScatteredPhoto {
  id: string;
  src: string;
  topPx: number;
  left?: string;
  right?: string;
  rotate: number;
  scale: number;
  depthTier: 0 | 1 | 2;
}

const PHOTO_SOURCES = [
  '/class-photos/image.png',
  '/class-photos/image1.png',
  '/class-photos/image2.png',
  '/class-photos/image3.png',
  '/class-photos/image4.png',
  '/class-photos/IMG_3480.png',
  '/class-photos/IMG_3481.png',
  '/class-photos/IMG_3483.png',
  '/class-photos/IMG_3485.png',
  '/class-photos/IMG_3487.png',
  '/class-photos/462538264_876806777613184_4586675279275945247_n.jpg',
  '/class-photos/462573273_345446471965507_168602458059275936_n.jpg.webp',
  '/class-photos/469747528_8980631125327409_5980355998330416835_n.jpg',
  '/class-photos/475872568_1366698184355352_2624849608648348302_n.jpg.webp',
  '/class-photos/494889008_1386901775843350_8239784291069828269_n.jpg',
  '/class-photos/566498962_1485381822723750_259176594370215259_n.jpg.webp',
  '/class-photos/566540435_1801019863866461_6743571529053003991_n.jpg.webp'
];

// Alternate between outer edge and inner margin on each side so consecutive same-side photos never overlap
const HORIZONTAL_SLOTS = [1.2, 1.4, 8.8, 8.5, 2.4, 2.6, 10.2, 9.8];
const BASE_ROTATIONS = [-6, 5, 4, -5, -7, 6, 3, -4, 7, -3];

const REPEAT_CYCLES = 4; // 4 * 17 = 68 scattered photos down the parallax canvas
const VERTICAL_STEP_PX = 78; // ~156px vertical gap on the same side so photos never cover each other

export const BackgroundClassPhotos: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Tight, critically-damped scroll smoothing: zero bounce/wiggle and no lag,
  // just enough micro-smoothing to remove discrete mouse-wheel stepping
  const smoothScroll = useSpring(scrollY, {
    stiffness: 500,
    damping: 60,
    mass: 0.2,
    restDelta: 0.5
  });

  // Photos move up slower than the foreground scroll speed without any jiggle
  const yDeep = useTransform(smoothScroll, (v) => (prefersReducedMotion ? 0 : -v * 0.18));
  const yMid = useTransform(smoothScroll, (v) => (prefersReducedMotion ? 0 : -v * 0.25));
  const yNear = useTransform(smoothScroll, (v) => (prefersReducedMotion ? 0 : -v * 0.32));

  const { deepPhotos, midPhotos, nearPhotos } = useMemo(() => {
    const jitter = (range: number) => (Math.random() - 0.5) * range;
    const allRepeated: string[] = [];

    // Build periodic cycles where boundary items don't collide with the previous cycle's tail
    let prevTail: string[] = [];
    for (let c = 0; c < REPEAT_CYCLES; c++) {
      const cycle = [...PHOTO_SOURCES].sort(() => Math.random() - 0.5);
      // Ensure first 3 items of new cycle weren't in last 3 items of previous cycle
      for (let i = 0; i < 3; i++) {
        if (prevTail.includes(cycle[i])) {
          const swapIdx = 4 + ((i * 3 + c) % (cycle.length - 4));
          [cycle[i], cycle[swapIdx]] = [cycle[swapIdx], cycle[i]];
        }
      }
      prevTail = cycle.slice(-3);
      allRepeated.push(...cycle);
    }

    const generated: ScatteredPhoto[] = allRepeated.map((src, idx) => {
      const side: 'left' | 'right' = idx % 2 === 0 ? 'left' : 'right';
      const baseSlot = HORIZONTAL_SLOTS[idx % HORIZONTAL_SLOTS.length];
      const baseRot = BASE_ROTATIONS[idx % BASE_ROTATIONS.length];

      const topPx = Math.max(24, Math.round(36 + idx * VERTICAL_STEP_PX + jitter(16)));
      const sideOffset = Math.max(0.8, baseSlot + jitter(1.2));
      const rotate = baseRot + jitter(4);
      const depthTier = (idx % 3) as 0 | 1 | 2;
      const scaleBase = depthTier === 0 ? 0.85 : depthTier === 1 ? 0.92 : 0.98;
      const scale = scaleBase + Math.random() * 0.08;

      return {
        id: `bg-class-photo-${idx}`,
        src,
        topPx,
        ...(side === 'left'
          ? { left: `${sideOffset.toFixed(1)}%` }
          : { right: `${sideOffset.toFixed(1)}%` }),
        rotate,
        scale,
        depthTier
      };
    });

    return {
      deepPhotos: generated.filter((p) => p.depthTier === 0),
      midPhotos: generated.filter((p) => p.depthTier === 1),
      nearPhotos: generated.filter((p) => p.depthTier === 2)
    };
  }, []);

  const renderPhotoCard = (photo: ScatteredPhoto, opacityClass: string) => (
    <div
      key={photo.id}
      style={{
        top: `${photo.topPx}px`,
        left: photo.left,
        right: photo.right,
        transform: `rotate(${photo.rotate.toFixed(1)}deg) scale(${photo.scale.toFixed(2)})`
      }}
      className={`absolute w-20 sm:w-28 md:w-32 lg:w-36 p-1 rounded-xl bg-[#f5f2eb]/[0.08] border border-[#f5f2eb]/15 shadow-lg ${opacityClass} transition-opacity duration-500`}
    >
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-auto max-h-36 rounded-lg object-cover brightness-105 contrast-100 saturate-100"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Deep Parallax Layer (Slowest: 0.18x scroll speed) */}
      <motion.div
        style={{ y: yDeep }}
        className="absolute inset-x-0 top-0 h-[5600px] will-change-transform"
      >
        {deepPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.28] sm:opacity-[0.34] md:opacity-[0.38]')
        )}
      </motion.div>

      {/* Mid Parallax Layer (Medium: 0.25x scroll speed) */}
      <motion.div
        style={{ y: yMid }}
        className="absolute inset-x-0 top-0 h-[5600px] will-change-transform"
      >
        {midPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.32] sm:opacity-[0.38] md:opacity-[0.44]')
        )}
      </motion.div>

      {/* Near Parallax Layer (Faster: 0.32x scroll speed) */}
      <motion.div
        style={{ y: yNear }}
        className="absolute inset-x-0 top-0 h-[5600px] will-change-transform"
      >
        {nearPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.36] sm:opacity-[0.42] md:opacity-[0.48]')
        )}
      </motion.div>
    </div>
  );
};
