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

// Horizontal offset bands (in %) so photos stay in the outer margins and softly frame the content
const HORIZONTAL_SLOTS = [1.5, 5.2, 2.8, 9.5, 1.8, 6.4, 3.6, 11.2];
const BASE_ROTATIONS = [-7, 6, 5, -6, -8, 7, 4, -5, 8, -4];

const REPEAT_CYCLES = 4; // 4 * 17 = 68 scattered photos down the parallax canvas
const VERTICAL_STEP_PX = 48; // Average vertical spacing between alternating left/right photos

export const BackgroundClassPhotos: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Multi-layer spring-smoothed scroll values for buttery parallax inertia
  const smoothScrollDeep = useSpring(scrollY, {
    stiffness: 55,
    damping: 24,
    mass: 0.75,
    restDelta: 0.1
  });
  const smoothScrollMid = useSpring(scrollY, {
    stiffness: 70,
    damping: 26,
    mass: 0.6,
    restDelta: 0.1
  });
  const smoothScrollNear = useSpring(scrollY, {
    stiffness: 85,
    damping: 28,
    mass: 0.5,
    restDelta: 0.1
  });

  // Photos move up slower than the foreground scroll speed (0.20x, 0.32x, 0.45x)
  const yDeep = useTransform(smoothScrollDeep, (v) => (prefersReducedMotion ? 0 : -v * 0.2));
  const yMid = useTransform(smoothScrollMid, (v) => (prefersReducedMotion ? 0 : -v * 0.32));
  const yNear = useTransform(smoothScrollNear, (v) => (prefersReducedMotion ? 0 : -v * 0.45));

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

      const topPx = Math.max(28, Math.round(45 + idx * VERTICAL_STEP_PX + jitter(24)));
      const sideOffset = Math.max(0.8, baseSlot + jitter(2.2));
      const rotate = baseRot + jitter(5);
      const depthTier = (idx % 3) as 0 | 1 | 2;
      const scaleBase = depthTier === 0 ? 0.82 : depthTier === 1 ? 0.9 : 0.98;
      const scale = scaleBase + Math.random() * 0.1;

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
      className={`absolute w-20 sm:w-28 md:w-32 lg:w-36 p-1 rounded-xl bg-[#f5f2eb]/[0.05] border border-[#f5f2eb]/10 shadow-lg ${opacityClass} transition-opacity duration-500`}
    >
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-auto max-h-36 rounded-lg object-cover saturate-[0.75] contrast-[0.95]"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Deep Parallax Layer (Slowest: 0.20x scroll speed) */}
      <motion.div
        style={{ y: yDeep }}
        className="absolute inset-x-0 top-0 h-[3600px] will-change-transform"
      >
        {deepPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.10] sm:opacity-[0.13] md:opacity-[0.15]')
        )}
      </motion.div>

      {/* Mid Parallax Layer (Medium: 0.32x scroll speed) */}
      <motion.div
        style={{ y: yMid }}
        className="absolute inset-x-0 top-0 h-[3600px] will-change-transform"
      >
        {midPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.12] sm:opacity-[0.16] md:opacity-[0.18]')
        )}
      </motion.div>

      {/* Near Parallax Layer (Faster: 0.45x scroll speed) */}
      <motion.div
        style={{ y: yNear }}
        className="absolute inset-x-0 top-0 h-[3600px] will-change-transform"
      >
        {nearPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.14] sm:opacity-[0.18] md:opacity-[0.21]')
        )}
      </motion.div>
    </div>
  );
};
