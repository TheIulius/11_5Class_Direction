import React from 'react';
import { ActiveTab } from './Navbar';

interface ScatteredClassPhotosProps {
  activeTab: ActiveTab;
}

interface PhotoPlacement {
  src: string;
  className: string; // positioning, sizing, rotation, responsive visibility
  darkOpacity: string;
  lightOpacity: string;
  rotation: string;
  sizeClass: string;
}

// Fixed, stable coordinates in outer gutters with gentle rotations (-5° to +5°)
// No borders, no Polaroid frames, soft rounded corners, desaturated and tinted.
const ALL_PHOTOS: PhotoPlacement[] = [
  // 1. Top left gutter (visible on desktop only)
  {
    src: '/class-photos/IMG_3480.png',
    className: 'top-28 -left-3 lg:left-6 xl:left-12 hidden lg:block',
    darkOpacity: 'opacity-16',
    lightOpacity: 'opacity-10',
    rotation: '-rotate-3',
    sizeClass: 'w-24 xl:w-28 h-auto',
  },
  // 2. Top right gutter (visible on md+)
  {
    src: '/class-photos/462538264_876806777613184_4586675279275945247_n.jpg',
    className: 'top-40 -right-2 md:right-4 xl:right-10 hidden md:block',
    darkOpacity: 'opacity-18',
    lightOpacity: 'opacity-11',
    rotation: 'rotate-4',
    sizeClass: 'w-28 xl:w-32 h-auto',
  },
  // 3. Mid-left gutter (visible on md+)
  {
    src: '/class-photos/469747528_8980631125327409_5980355998330416835_n.jpg',
    className: 'top-[620px] -left-2 md:left-4 xl:left-8 hidden md:block',
    darkOpacity: 'opacity-14',
    lightOpacity: 'opacity-9',
    rotation: 'rotate-2',
    sizeClass: 'w-24 xl:w-32 h-auto',
  },
  // 4. Mid-right gutter (visible on lg+)
  {
    src: '/class-photos/IMG_3485.png',
    className: 'top-[880px] -right-3 lg:right-6 xl:right-12 hidden lg:block',
    darkOpacity: 'opacity-15',
    lightOpacity: 'opacity-10',
    rotation: '-rotate-4',
    sizeClass: 'w-28 xl:w-36 h-auto',
  },
  // 5. Far right lower (desktop only)
  {
    src: '/class-photos/494889008_1386901775843350_8239784291069828269_n.jpg',
    className: 'top-[1320px] -right-2 xl:right-8 hidden xl:block',
    darkOpacity: 'opacity-13',
    lightOpacity: 'opacity-8',
    rotation: 'rotate-3',
    sizeClass: 'w-28 h-auto',
  },
  // 6. Mobile / tablet subtle peripheral edge photo (carefully placed away from central text)
  {
    src: '/class-photos/IMG_3487.png',
    className: 'top-[340px] -right-5 md:hidden block pointer-events-none',
    darkOpacity: 'opacity-12',
    lightOpacity: 'opacity-7',
    rotation: '-rotate-4',
    sizeClass: 'w-20 h-auto',
  },
];

export const ScatteredClassPhotos: React.FC<ScatteredClassPhotosProps> = ({ activeTab }) => {
  // On reading/quiz, calendar, and homework screens, confine photos strictly to the periphery
  // and reduce density even further to protect focus.
  const isReadingOrFocusScreen = activeTab === 'materials' || activeTab === 'calendar' || activeTab === 'homework';

  // Filter photos based on section density
  const photosToDisplay = isReadingOrFocusScreen
    ? ALL_PHOTOS.slice(0, 3) // Only 2-3 outer photos on focus pages
    : ALL_PHOTOS;

  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
    >
      {photosToDisplay.map((photo, index) => (
        <div
          key={index}
          className={`absolute ${photo.className} ${photo.sizeClass} ${photo.rotation} transition-opacity duration-300`}
        >
          <img
            src={photo.src}
            alt=""
            loading="lazy"
            decoding="async"
            className={`w-full h-auto object-cover rounded-xl ${photo.lightOpacity} dark:${photo.darkOpacity} saturate-[0.82] filter blur-[0.3px] transition-all`}
          />
        </div>
      ))}
    </div>
  );
};
