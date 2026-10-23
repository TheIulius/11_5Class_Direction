import React, { useEffect, useMemo, useRef } from 'react';

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

// Deterministic PRNG in [0, 1) so random scatter is organic and stable across renders
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const BackgroundClassPhotos: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback for browsers that don't support CSS scroll-driven animations
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof CSS === 'undefined' ||
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)')
    ) {
      return;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const container = containerRef.current;
    const wrapper =
      (container?.closest('.campaign-parallax-wrapper') as HTMLElement | null) ||
      document.documentElement;
    if (!container || !wrapper) return;

    const layers = Array.from(
      container.querySelectorAll<HTMLElement>('.campaign-parallax-layer')
    );
    const layerOffsets = [55, 68, 80];

    const onScroll = () => {
      const scrollY = window.scrollY;
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperTop = wrapperRect.top + scrollY;
      const wrapperHeight = wrapper.scrollHeight || wrapperRect.height;
      const windowHeight = window.innerHeight;

      if (scrollY >= wrapperTop - windowHeight && scrollY <= wrapperTop + wrapperHeight) {
        const denom = Math.max(1, wrapperHeight + windowHeight);
        const scrollPercent = (scrollY - (wrapperTop - windowHeight)) / denom;

        layers.forEach((layer, index) => {
          const initialTranslateY = layerOffsets[index] ?? 55;
          const translateY = initialTranslateY * (1 - scrollPercent);
          layer.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            window.removeEventListener('scroll', onScroll);
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(wrapper);
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const { deepPhotos, midPhotos, nearPhotos } = useMemo(() => {
    const rng = createRng(11052026);
    const generated: ScatteredPhoto[] = [];

    // True 2D Poisson-disc rejection sampling carried out independently on Left & Right wings
    // so there are ZERO vertical columns or rows, and ZERO overlapping pairs!
    const canvasHeightPx = 1360;
    const minHorizontalDistPct = 6.2; // prevents side-by-side overlap
    const minVerticalDistPx = 104; // prevents top-to-bottom overlap even with parallax shift

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
        // Organic polaroid tilt (-6.5 deg to +6.5 deg) and varied scale (0.86 to 1.10)
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
          depthTier
        });
      }
    };

    populateWing('left', 42);
    populateWing('right', 42);

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
      className={`absolute w-12 sm:w-16 md:w-[4.5rem] lg:w-20 p-[3px] rounded-lg bg-[#f5f2eb]/[0.09] border border-[#f5f2eb]/[0.16] shadow-sm ${opacityClass}`}
    >
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full aspect-[4/3] rounded-[5px] object-cover brightness-[0.97] contrast-[0.96] saturate-[0.90]"
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 14%, rgba(0,0,0,0.52) 24%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.12) 66%, rgba(0,0,0,0.52) 76%, rgba(0,0,0,0.92) 86%, rgba(0,0,0,1) 100%)',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 14%, rgba(0,0,0,0.52) 24%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.12) 66%, rgba(0,0,0,0.52) 76%, rgba(0,0,0,0.92) 86%, rgba(0,0,0,1) 100%)'
      }}
      className="fixed inset-0 pointer-events-none overflow-clip z-0 select-none"
      aria-hidden="true"
    >
      {/* Deep Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-24 h-[1420px] will-change-transform">
        {deepPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.20] sm:opacity-[0.24] md:opacity-[0.27]')
        )}
      </div>

      {/* Mid Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-24 h-[1420px] will-change-transform">
        {midPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.24] sm:opacity-[0.28] md:opacity-[0.31]')
        )}
      </div>

      {/* Near Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-24 h-[1420px] will-change-transform">
        {nearPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.27] sm:opacity-[0.31] md:opacity-[0.35]')
        )}
      </div>
    </div>
  );
};
