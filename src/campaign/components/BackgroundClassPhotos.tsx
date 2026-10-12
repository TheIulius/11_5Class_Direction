import React, { useMemo } from 'react';

interface ScatteredPhoto {
  id: string;
  src: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  scale: number;
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

// Anchor zones around the viewport so all 17 photos are distributed organically without bunching up
const ANCHOR_ZONES: { top: number; side: 'left' | 'right'; offset: number; baseRotate: number }[] = [
  { top: 7, side: 'left', offset: 2.0, baseRotate: -7 },
  { top: 9, side: 'right', offset: 2.5, baseRotate: 6 },
  { top: 20, side: 'left', offset: 5.5, baseRotate: 5 },
  { top: 22, side: 'right', offset: 6.0, baseRotate: -5 },
  { top: 33, side: 'left', offset: 1.5, baseRotate: -8 },
  { top: 35, side: 'right', offset: 2.0, baseRotate: 7 },
  { top: 46, side: 'left', offset: 4.5, baseRotate: 4 },
  { top: 48, side: 'right', offset: 5.0, baseRotate: -6 },
  { top: 59, side: 'left', offset: 2.0, baseRotate: -5 },
  { top: 61, side: 'right', offset: 2.5, baseRotate: 8 },
  { top: 71, side: 'left', offset: 6.0, baseRotate: 6 },
  { top: 73, side: 'right', offset: 5.5, baseRotate: -7 },
  { top: 83, side: 'left', offset: 2.2, baseRotate: -4 },
  { top: 85, side: 'right', offset: 2.8, baseRotate: 5 },
  { top: 14, side: 'left', offset: 12.0, baseRotate: -3 },
  { top: 53, side: 'right', offset: 11.5, baseRotate: 4 },
  { top: 89, side: 'left', offset: 11.0, baseRotate: 7 }
];

export const BackgroundClassPhotos: React.FC = () => {
  const photos = useMemo<ScatteredPhoto[]>(() => {
    const jitter = (range: number) => (Math.random() - 0.5) * range;

    // Shuffle photo order slightly for organic variety
    const shuffled = [...PHOTO_SOURCES].sort(() => Math.random() - 0.5);

    return shuffled.map((src, idx) => {
      const zone = ANCHOR_ZONES[idx % ANCHOR_ZONES.length];
      const topPos = Math.max(4, Math.min(92, zone.top + jitter(3.5)));
      const sideOffset = Math.max(1, zone.offset + jitter(2.5));
      const rotation = zone.baseRotate + jitter(5);
      const scale = 0.84 + Math.random() * 0.18;

      return {
        id: `bg-class-photo-${idx}`,
        src,
        top: `${topPos.toFixed(1)}%`,
        ...(zone.side === 'left'
          ? { left: `${sideOffset.toFixed(1)}%` }
          : { right: `${sideOffset.toFixed(1)}%` }),
        rotate: rotation,
        scale
      };
    });
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {photos.map(photo => (
        <div
          key={photo.id}
          style={{
            top: photo.top,
            left: photo.left,
            right: photo.right,
            transform: `rotate(${photo.rotate.toFixed(1)}deg) scale(${photo.scale.toFixed(2)})`
          }}
          className="absolute w-20 sm:w-28 md:w-32 lg:w-36 p-1 rounded-xl bg-[#f5f2eb]/[0.05] border border-[#f5f2eb]/10 shadow-lg opacity-[0.12] sm:opacity-[0.16] md:opacity-[0.19] transition-opacity duration-500"
        >
          <img
            src={photo.src}
            alt=""
            loading="lazy"
            className="w-full h-auto max-h-36 rounded-lg object-cover saturate-[0.75] contrast-[0.95]"
          />
        </div>
      ))}
    </div>
  );
};
