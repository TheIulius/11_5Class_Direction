import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { ActiveTab } from './Navbar';
import { usePlatform, DEFAULT_BACKGROUND_PHYSICS } from '../context/PlatformContext';

export interface BackgroundClassPhotosProps {
  activeTab?: ActiveTab;
}

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
  '/class-photos/566540435_1801019863866461_6743571529053003991_n.jpg.webp',
];

// Deterministic PRNG in [0, 1) so random scatter is organic and stable across renders
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const BackgroundClassPhotos: React.FC<BackgroundClassPhotosProps> = () => {
  const prefersReducedMotion = useReducedMotion();
  const { platform } = usePlatform();
  const settings = platform?.backgroundPhysics || DEFAULT_BACKGROUND_PHYSICS;
  const { scrollY } = useScroll();

  // Fast scroll & discrete wheel detection:
  // When user uses mouse scroll wheel or swipes rapidly, dynamically lower mass and boost stiffness for 0 delay
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const fastScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!settings.adaptiveFastScroll) {
      setIsFastScrolling(false);
      return;
    }

    const handleWheel = () => {
      setIsFastScrolling(true);
      if (fastScrollTimerRef.current) clearTimeout(fastScrollTimerRef.current);
      fastScrollTimerRef.current = setTimeout(() => {
        setIsFastScrolling(false);
      }, 140);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (fastScrollTimerRef.current) clearTimeout(fastScrollTimerRef.current);
    };
  }, [settings.adaptiveFastScroll]);

  // Dynamic parameters based on active wheel / fast scroll state
  const effectiveStiffness = isFastScrolling
    ? Math.max(settings.stiffness * 1.55, 800)
    : settings.stiffness;
  const effectiveMass = isFastScrolling
    ? Math.min(settings.mass * 0.35, 0.025)
    : settings.mass;
  const effectiveDamping = isFastScrolling
    ? Math.max(settings.damping, 18)
    : settings.damping;

  // Snappy, low-delay multi-layer spring scroll values with smooth jiggle settle
  const smoothScrollDeep = useSpring(scrollY, {
    stiffness: effectiveStiffness * 0.88,
    damping: effectiveDamping * 0.92,
    mass: effectiveMass * 1.15,
    restDelta: 0.05,
  });
  const smoothScrollMid = useSpring(scrollY, {
    stiffness: effectiveStiffness,
    damping: effectiveDamping,
    mass: effectiveMass,
    restDelta: 0.05,
  });
  const smoothScrollNear = useSpring(scrollY, {
    stiffness: effectiveStiffness * 1.14,
    damping: effectiveDamping * 1.08,
    mass: effectiveMass * 0.9,
    restDelta: 0.05,
  });

  // Photos move up slower than foreground scroll speed (0.20x, 0.32x, 0.45x) without rolling
  const yDeep = useTransform(smoothScrollDeep, (v) => (prefersReducedMotion ? 0 : -v * settings.parallaxDeep));
  const yMid = useTransform(smoothScrollMid, (v) => (prefersReducedMotion ? 0 : -v * settings.parallaxMid));
  const yNear = useTransform(smoothScrollNear, (v) => (prefersReducedMotion ? 0 : -v * settings.parallaxNear));

  const { deepPhotos, midPhotos, nearPhotos } = useMemo(() => {
    const rng = createRng(11052026);
    const generated: ScatteredPhoto[] = [];

    // True 2D Poisson-disc rejection sampling carried out independently on Left & Right wings
    // (from commit 7c16153 / fde8038, tuned to be slightly less dense and cover tall scroll heights)
    const canvasHeightPx = 1800;
    const minHorizontalDistPct = 7.0; // prevents side-by-side overlap
    const minVerticalDistPx = 122; // prevents top-to-bottom overlap even with parallax shift

    const populateWing = (side: 'left' | 'right', targetCount: number) => {
      const placed: { xPct: number; yPx: number; src: string }[] = [];
      let attempts = 0;

      while (placed.length < targetCount && attempts < 6000) {
        attempts++;
        // Continuous random horizontal position between 0.6% and 22.5% from screen edge
        const xPct = 0.6 + rng() * 21.9;
        // Continuous random vertical position across the canvas
        const yPx = 18 + rng() * (canvasHeightPx - 36);

        // Check elliptical minimum distance against all already-placed photos on this side
        let tooClose = false;
        for (const p of placed) {
          const dx = (xPct - p.xPct) / minHorizontalDistPct;
          const dy = (yPx - p.yPx) / minVerticalDistPx;
          if (dx * dx + dy * dy < 1.0) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        // Avoid picking the exact same photo source as a nearby neighbor
        const startIdx = Math.floor(rng() * PHOTO_SOURCES.length);
        let chosenSrc = PHOTO_SOURCES[startIdx];
        for (let s = 0; s < PHOTO_SOURCES.length; s++) {
          const candidate = PHOTO_SOURCES[(startIdx + s) % PHOTO_SOURCES.length];
          const neighborHasSame = placed.some(
            (p) =>
              p.src === candidate &&
              Math.abs(p.yPx - yPx) < 260 &&
              Math.abs(p.xPct - xPct) < 14
          );
          if (!neighborHasSame) {
            chosenSrc = candidate;
            break;
          }
        }

        const idx = generated.length;
        const depthTier = (idx % 3) as 0 | 1 | 2;
        // Organic tilt (-6.5 deg to +6.5 deg) and varied scale (0.86 to 1.10)
        const rotate = (rng() - 0.5) * 13;
        const scale = 0.86 + rng() * 0.24;

        placed.push({ xPct, yPx, src: chosenSrc });
        generated.push({
          id: `bg-class-photo-${side}-${placed.length}`,
          src: chosenSrc,
          topPx: Math.round(yPx),
          ...(side === 'left'
            ? { left: `${xPct.toFixed(2)}%` }
            : { right: `${xPct.toFixed(2)}%` }),
          rotate,
          scale,
          depthTier,
        });
      }
    };

    populateWing('left', 36);
    populateWing('right', 36);

    return {
      deepPhotos: generated.filter((p) => p.depthTier === 0),
      midPhotos: generated.filter((p) => p.depthTier === 1),
      nearPhotos: generated.filter((p) => p.depthTier === 2),
    };
  }, []);

  const renderPhotoCard = (photo: ScatteredPhoto, opacityClass: string) => (
    <div
      key={photo.id}
      style={{
        top: `${photo.topPx}px`,
        left: photo.left,
        right: photo.right,
        transform: `rotate(${photo.rotate.toFixed(1)}deg) scale(${photo.scale.toFixed(2)})`,
      }}
      className={`bg-class-photo-card absolute w-12 sm:w-16 md:w-[4.5rem] lg:w-20 p-[3px] rounded-lg bg-[#f5f2eb]/[0.09] border border-[#f5f2eb]/[0.16] shadow-sm ${opacityClass}`}
    >
      <img
        src={photo.src}
        alt=""
        decoding="async"
        className="w-full aspect-[4/3] rounded-[5px] object-cover brightness-[0.97] contrast-[0.96] saturate-[0.90]"
      />
    </div>
  );

  return (
    <div
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 14%, rgba(0,0,0,0.52) 24%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.12) 66%, rgba(0,0,0,0.52) 76%, rgba(0,0,0,0.92) 86%, rgba(0,0,0,1) 100%)',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 14%, rgba(0,0,0,0.52) 24%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.12) 66%, rgba(0,0,0,0.52) 76%, rgba(0,0,0,0.92) 86%, rgba(0,0,0,1) 100%)',
      }}
      className="bg-class-photos-root fixed inset-0 pointer-events-none overflow-clip z-0 select-none"
      aria-hidden="true"
    >
      {/* Deep Parallax Layer (Slowest: 0.20x scroll speed) */}
      <motion.div
        style={{ y: yDeep }}
        className="absolute inset-x-0 -top-12 h-[1850px] will-change-transform"
      >
        {deepPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.18] sm:opacity-[0.21] md:opacity-[0.24]')
        )}
      </motion.div>

      {/* Mid Parallax Layer (Medium: 0.32x scroll speed) */}
      <motion.div
        style={{ y: yMid }}
        className="absolute inset-x-0 -top-12 h-[1850px] will-change-transform"
      >
        {midPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.21] sm:opacity-[0.25] md:opacity-[0.28]')
        )}
      </motion.div>

      {/* Near Parallax Layer (Faster: 0.45x scroll speed) */}
      <motion.div
        style={{ y: yNear }}
        className="absolute inset-x-0 -top-12 h-[1850px] will-change-transform"
      >
        {nearPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.24] sm:opacity-[0.28] md:opacity-[0.31]')
        )}
      </motion.div>
    </div>
  );
};
