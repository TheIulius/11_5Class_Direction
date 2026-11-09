import React, { useEffect, useMemo, useRef } from 'react';
import { ActiveTab } from './Navbar';

export interface BackgroundClassPhotosProps {
  activeTab?: ActiveTab;
}

interface ScatteredPhoto {
  id: string;
  src: string;
  topPx: number;
  left?: string;
  right?: string;
  baseRotate: number;
  scale: number;
  depthTier: 0 | 1 | 2;
  mobileVisible: boolean;
  // Per-photo spring & parallax physics parameters
  parallaxFactor: number;
  stiffness: number;
  damping: number;
  mass: number;
  rotStiffness: number;
  rotDamping: number;
  rotMass: number;
  wobbleDirection: number;
  swayFactor: number;
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

// Deterministic PRNG in [0, 1) so random scatter is organic and 100% stable across renders
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const BackgroundClassPhotos: React.FC<BackgroundClassPhotosProps> = ({ activeTab }) => {
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  const photos = useMemo<ScatteredPhoto[]>(() => {
    const rng = createRng(11052026);
    const generated: ScatteredPhoto[] = [];
    const placed: {
      xPct: number;
      yPx: number;
      src: string;
      mobileVisible: boolean;
    }[] = [];

    // 2D Poisson-disc rejection sampling across the continuous background canvas
    // Slightly less dense than the previous 84-photo layout (~50 photos across 1650px)
    const canvasHeightPx = 1650;
    const minHorizontalDistPct = 10.4; // prevents side-by-side overlap
    const minVerticalDistPx = 122; // prevents top-to-bottom overlap even during parallax shifts
    const targetCount = 50;

    let attempts = 0;
    while (placed.length < targetCount && attempts < 10000) {
      attempts++;

      // Continuous horizontal distribution across the entire viewport (1.2% to 94.5%),
      // gently weighted toward the outer wings while keeping a continuous field across the page
      const bandRoll = rng();
      let xPct: number;
      if (bandRoll < 0.33) {
        xPct = 1.2 + rng() * 23.0; // Left wing (1.2%..24.2%)
      } else if (bandRoll < 0.66) {
        xPct = 71.8 + rng() * 22.7; // Right wing (71.8%..94.5%)
      } else {
        xPct = 24.2 + rng() * 47.6; // Continuous center field (24.2%..71.8%)
      }

      const yPx = 22 + rng() * (canvasHeightPx - 44);

      // Elliptical minimum distance check against all already-placed photos
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

      // Mobile spacing check so narrow viewports stay clean and never overlap
      let mobileTooClose = false;
      for (const p of placed) {
        if (!p.mobileVisible) continue;
        const dx = (xPct - p.xPct) / 24.0;
        const dy = (yPx - p.yPx) / 142.0;
        if (dx * dx + dy * dy < 1.0) {
          mobileTooClose = true;
          break;
        }
      }
      const mobileVisible = !mobileTooClose;

      // Avoid picking the exact same photo source as a nearby neighbor
      const startIdx = Math.floor(rng() * PHOTO_SOURCES.length);
      let chosenSrc = PHOTO_SOURCES[startIdx];
      for (let s = 0; s < PHOTO_SOURCES.length; s++) {
        const candidate = PHOTO_SOURCES[(startIdx + s) % PHOTO_SOURCES.length];
        const neighborHasSame = placed.some(
          (p) =>
            p.src === candidate &&
            Math.abs(p.yPx - yPx) < 300 &&
            Math.abs(p.xPct - xPct) < 26
        );
        if (!neighborHasSame) {
          chosenSrc = candidate;
          break;
        }
      }

      const idx = generated.length;
      const depthTier = (idx % 3) as 0 | 1 | 2;

      // Varied organic resting rotation (-6.5 deg to +6.5 deg) and natural scale (0.86 to 1.10)
      const baseRotate = (rng() - 0.5) * 13;
      const scale = 0.86 + depthTier * 0.05 + rng() * 0.14;

      // Per-photo depth & spring characteristics so photos move with individual life
      const parallaxFactor =
        depthTier === 0
          ? 0.16 + rng() * 0.05 // Deep layer: 0.16x - 0.21x
          : depthTier === 1
          ? 0.26 + rng() * 0.06 // Mid layer: 0.26x - 0.32x
          : 0.37 + rng() * 0.07; // Near layer: 0.37x - 0.44x

      const stiffness =
        depthTier === 0
          ? 210 + rng() * 40
          : depthTier === 1
          ? 255 + rng() * 45
          : 300 + rng() * 55;
      const mass =
        depthTier === 0
          ? 0.48 + rng() * 0.07
          : depthTier === 1
          ? 0.42 + rng() * 0.06
          : 0.36 + rng() * 0.05;
      // Underdamped ratio zeta in [0.62, 0.70] gives responsive tracking + gentle spring overshoot on stop
      const zeta = 0.62 + rng() * 0.08;
      const damping = 2 * zeta * Math.sqrt(stiffness * mass);

      // Rotational wobble spring parameters
      const rotStiffness = 225 + rng() * 65;
      const rotMass = 0.38 + rng() * 0.08;
      const rotZeta = 0.58 + rng() * 0.08;
      const rotDamping = 2 * rotZeta * Math.sqrt(rotStiffness * rotMass);
      const wobbleDirection = (idx % 2 === 0 ? 1 : -1) * (0.75 + rng() * 0.55);
      const swayFactor = (rng() - 0.5) * 1.5;

      placed.push({ xPct, yPx, src: chosenSrc, mobileVisible });

      // Position relative to left or right edge so photos never cause horizontal overflow
      const useRightEdge = xPct > 52;
      const edgeOffsetPct = useRightEdge ? Math.max(1.2, 100 - xPct - 4.5) : xPct;

      generated.push({
        id: `bg-class-photo-${idx}`,
        src: chosenSrc,
        topPx: Math.round(yPx),
        ...(useRightEdge
          ? { right: `${edgeOffsetPct.toFixed(2)}%` }
          : { left: `${edgeOffsetPct.toFixed(2)}%` }),
        baseRotate,
        scale,
        depthTier,
        mobileVisible,
        parallaxFactor,
        stiffness,
        damping,
        mass,
        rotStiffness,
        rotDamping,
        rotMass,
        wobbleDirection,
        swayFactor,
      });
    }

    return generated;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = Boolean(mediaQuery?.matches);

    const isMobileViewport = () => window.innerWidth < 640;

    // Initialize per-photo physics state at the current scroll position
    const initialScrollY = getScrollY();
    const states = photos.map((p) => ({
      y: reducedMotion ? 0 : -initialScrollY * p.parallaxFactor,
      vy: 0,
      rotOffset: 0,
      vrot: 0,
    }));

    const applyRestingTransforms = (scrollPos: number) => {
      const mobileScaleFactor = isMobileViewport() ? 0.65 : 1.0;
      for (let i = 0; i < photos.length; i++) {
        const el = photoRefs.current[i];
        if (!el) continue;
        const p = photos[i];
        const targetY = reducedMotion ? 0 : -scrollPos * p.parallaxFactor * mobileScaleFactor;
        states[i].y = targetY;
        states[i].vy = 0;
        states[i].rotOffset = 0;
        states[i].vrot = 0;
        el.style.transform = `translate3d(0px, ${targetY.toFixed(2)}px, 0) rotate(${p.baseRotate.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
      }
    };

    applyRestingTransforms(initialScrollY);

    let rafId: number | null = null;
    let lastFrameTime = performance.now();
    let prevScrollY = initialScrollY;
    let smoothScrollVel = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const currentScrollY = getScrollY();
      const rawScrollVel = (currentScrollY - prevScrollY) / dt;
      prevScrollY = currentScrollY;

      // Fast-reacting low-pass filter on scroll velocity
      smoothScrollVel += (rawScrollVel - smoothScrollVel) * Math.min(1, dt * 22);
      const mobileFactor = isMobileViewport() ? 0.65 : 1.0;
      const clampedVel = Math.max(-1900, Math.min(1900, smoothScrollVel)) * mobileFactor;

      let anyActive = Math.abs(smoothScrollVel) > 1.0;

      for (let i = 0; i < photos.length; i++) {
        const el = photoRefs.current[i];
        if (!el) continue;

        const p = photos[i];
        const s = states[i];

        const targetY = -currentScrollY * p.parallaxFactor * mobileFactor;
        const fy = (targetY - s.y) * p.stiffness - s.vy * p.damping;
        s.vy += (fy / p.mass) * dt;
        s.y += s.vy * dt;

        // Rotational wobble responds to scroll velocity + spring velocity for lively directional jiggle
        const targetRot =
          (clampedVel / 400) * p.wobbleDirection +
          Math.max(-1.8, Math.min(1.8, (s.vy / 280) * p.wobbleDirection));
        const frot = (targetRot - s.rotOffset) * p.rotStiffness - s.vrot * p.rotDamping;
        s.vrot += (frot / p.rotMass) * dt;
        s.rotOffset += s.vrot * dt;

        const xOffset = s.rotOffset * p.swayFactor;
        const totalRot = p.baseRotate + s.rotOffset;

        el.style.transform = `translate3d(${xOffset.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotate(${totalRot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;

        if (
          Math.abs(targetY - s.y) > 0.08 ||
          Math.abs(s.vy) > 0.15 ||
          Math.abs(s.rotOffset) > 0.025 ||
          Math.abs(s.vrot) > 0.08
        ) {
          anyActive = true;
        }
      }

      if (anyActive && !reducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        // Snap cleanly to exact resting positions and hibernate loop
        for (let i = 0; i < photos.length; i++) {
          const el = photoRefs.current[i];
          if (!el) continue;
          const p = photos[i];
          const restY = reducedMotion ? 0 : -currentScrollY * p.parallaxFactor * mobileFactor;
          states[i].y = restY;
          states[i].vy = 0;
          states[i].rotOffset = 0;
          states[i].vrot = 0;
          el.style.transform = `translate3d(0px, ${restY.toFixed(2)}px, 0) rotate(${p.baseRotate.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
        }
        rafId = null;
      }
    };

    const onScroll = () => {
      if (reducedMotion) return;
      if (rafId === null) {
        lastFrameTime = performance.now() - 16;
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onMotionPrefChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      if (reducedMotion && rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      applyRestingTransforms(getScrollY());
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    mediaQuery?.addEventListener?.('change', onMotionPrefChange);

    return () => {
      window.removeEventListener('scroll', onScroll);
      mediaQuery?.removeEventListener?.('change', onMotionPrefChange);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [photos]);

  // Subtle focus reduction on dense study tabs while keeping consistent visibility
  const containerOpacityClass =
    activeTab === 'materials' || activeTab === 'calendar'
      ? 'opacity-85'
      : 'opacity-100';

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-300 ${containerOpacityClass}`}
      aria-hidden="true"
    >
      {photos.map((photo, index) => {
        const tierOpacityClass =
          photo.depthTier === 0
            ? 'opacity-[0.13] dark:opacity-[0.18]'
            : photo.depthTier === 1
            ? 'opacity-[0.15] dark:opacity-[0.21]'
            : 'opacity-[0.17] dark:opacity-[0.24]';

        const mobileVisibilityClass = photo.mobileVisible
          ? 'block'
          : 'hidden sm:block';

        return (
          <div
            key={photo.id}
            ref={(el) => {
              photoRefs.current[index] = el;
            }}
            style={{
              top: `${photo.topPx}px`,
              left: photo.left,
              right: photo.right,
              transform: `translate3d(0px, 0px, 0) rotate(${photo.baseRotate.toFixed(2)}deg) scale(${photo.scale.toFixed(3)})`,
            }}
            className={`absolute w-14 sm:w-16 md:w-20 lg:w-[88px] will-change-transform ${tierOpacityClass} ${mobileVisibilityClass}`}
          >
            <img
              src={photo.src}
              alt=""
              decoding="async"
              className="w-full h-auto max-h-24 rounded-md object-cover brightness-[0.95] contrast-[0.95] saturate-[0.84]"
            />
          </div>
        );
      })}
    </div>
  );
};
