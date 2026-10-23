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

// 5 horizontal lanes per side (10 lanes total across left & right wings)
const WING_LANES_PERCENT = [0.9, 5.1, 9.3, 13.5, 17.7];
// Knight's-move vertical phase per lane so adjacent lanes are maximally staggered vertically
const LANE_PHASE_FRACTIONS = [0.0, 0.42, 0.82, 0.22, 0.62];
// Subtle, calm micro-rotations (-2.4 deg to +2.4 deg) so dense tiles never feel chaotic
const CALM_ROTATIONS = [-2.2, 1.8, -1.4, 2.1, -1.9, 1.5, -1.1, 2.3, -1.6, 1.2];

const ROWS_PER_LANE = 16; // 16 rows * 10 lanes = 160 miniature photos across the viewport canvas
const ROW_SPACING_PX = 82; // ~82px vertical spacing within the same lane (tiles are ~30-42px tall)

// Deterministic pseudo-random helper in [-0.5, 0.5] so layout never shifts on re-render
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

export const BackgroundClassPhotos: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback for browsers that don't support CSS scroll-driven animations:
  // Direct 1:1 scroll transform with zero spring delay and zero jiggle
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
    const layerOffsets = [60, 95, 130];

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
          const initialTranslateY = layerOffsets[index] ?? 60 * (index + 1);
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
    const generated: ScatteredPhoto[] = [];
    const totalLanes = WING_LANES_PERCENT.length * 2; // 5 left + 5 right = 10 lanes
    let photoIdx = 0;

    for (let row = 0; row < ROWS_PER_LANE; row++) {
      for (let laneIdx = 0; laneIdx < totalLanes; laneIdx++) {
        const side: 'left' | 'right' = laneIdx % 2 === 0 ? 'left' : 'right';
        const wingLane = Math.floor(laneIdx / 2); // 0..4

        const baseHorizontal = WING_LANES_PERCENT[wingLane];
        const phaseOffsetPx = LANE_PHASE_FRACTIONS[wingLane] * ROW_SPACING_PX;
        const sideStaggerPx = side === 'right' ? ROW_SPACING_PX * 0.19 : 0;

        const topJitter = seededUnit(photoIdx * 3 + 1) * 10;
        const horizJitter = seededUnit(photoIdx * 5 + 2) * 0.7;
        const rotJitter = seededUnit(photoIdx * 7 + 3) * 0.8;

        const topPx = Math.max(
          10,
          Math.round(14 + row * ROW_SPACING_PX + phaseOffsetPx + sideStaggerPx + topJitter)
        );
        const sideOffset = Math.max(0.6, baseHorizontal + horizJitter);
        const rotate = CALM_ROTATIONS[photoIdx % CALM_ROTATIONS.length] + rotJitter;

        const depthTier = ((row + wingLane + (side === 'right' ? 1 : 0)) % 3) as 0 | 1 | 2;
        const scaleBase = depthTier === 0 ? 0.86 : depthTier === 1 ? 0.92 : 0.98;
        const scale = scaleBase + (seededUnit(photoIdx * 11 + 5) + 0.5) * 0.05;

        // Pick source using coprime stride so neighbors in row & lane are always distinct photos
        const src = PHOTO_SOURCES[(row * 7 + laneIdx * 3) % PHOTO_SOURCES.length];

        generated.push({
          id: `bg-class-photo-${photoIdx}`,
          src,
          topPx,
          ...(side === 'left'
            ? { left: `${sideOffset.toFixed(2)}%` }
            : { right: `${sideOffset.toFixed(2)}%` }),
          rotate,
          scale,
          depthTier
        });

        photoIdx++;
      }
    }

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
      className={`absolute w-8 sm:w-10 md:w-12 lg:w-14 p-[2px] rounded-md bg-[#f5f2eb]/[0.03] border border-[#f5f2eb]/[0.06] ${opacityClass}`}
    >
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full aspect-[4/3] rounded-[4px] object-cover brightness-[0.88] contrast-[0.88] saturate-[0.65]"
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 11%, rgba(0,0,0,0.38) 21%, rgba(0,0,0,0.08) 32%, rgba(0,0,0,0.08) 68%, rgba(0,0,0,0.38) 79%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.95) 100%)',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 11%, rgba(0,0,0,0.38) 21%, rgba(0,0,0,0.08) 32%, rgba(0,0,0,0.08) 68%, rgba(0,0,0,0.38) 79%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.95) 100%)'
      }}
      className="fixed inset-0 pointer-events-none overflow-clip z-0 select-none"
      aria-hidden="true"
    >
      {/* Deep Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-28 h-[1420px] will-change-transform">
        {deepPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.10] sm:opacity-[0.12] md:opacity-[0.14]')
        )}
      </div>

      {/* Mid Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-28 h-[1420px] will-change-transform">
        {midPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.12] sm:opacity-[0.15] md:opacity-[0.17]')
        )}
      </div>

      {/* Near Parallax Layer */}
      <div className="campaign-parallax-layer absolute inset-x-0 -top-28 h-[1420px] will-change-transform">
        {nearPhotos.map((photo) =>
          renderPhotoCard(photo, 'opacity-[0.14] sm:opacity-[0.18] md:opacity-[0.20]')
        )}
      </div>
    </div>
  );
};
