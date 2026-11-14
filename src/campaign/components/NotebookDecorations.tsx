import React from 'react';

/**
 * Hand-drawn decorative SVG & CSS elements reproduced from live KomClub reference:
 * 1. SketchPurpleSmiley — dashed purple circle with curved smile stroke overlapping card corners
 * 2. SketchBlueArrow — curved blue dashed arrow with hand-drawn open arrowhead
 * 3. TapeStrip — translucent masking tape strip with dashed side edges at top of boards
 * 4. PinDot — circular outlined pushpin dot at top center of noticeboard cards
 *
 * All decorative visuals use aria-hidden="true" and pointer-events-none so they never
 * block clicks or pollute screen-reader output.
 */

export const SketchPurpleSmiley: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 78 78"
    className={`nb-sketch-smiley pointer-events-none select-none ${className}`}
  >
    <path
      d="M39 6c18 0 33 15 33 33S57 72 39 72 6 57 6 39 21 6 39 6z"
      stroke="currentColor"
      strokeDasharray="9 8"
      strokeLinecap="round"
      strokeWidth="3"
    />
    <path
      d="M27 44c6 7 18 7 24 0"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
);

export const SketchBlueArrow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 72 96"
    className={`nb-sketch-arrow pointer-events-none select-none ${className}`}
  >
    <path
      d="M6 4C2 34 14 62 44 78"
      stroke="currentColor"
      strokeDasharray="7 7"
      strokeLinecap="round"
      strokeWidth="3"
    />
    <path
      d="M30 76l16 4-6-15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
    />
  </svg>
);

export const TapeStrip: React.FC<{
  tilt?: 'left' | 'right' | 'center';
  className?: string;
}> = ({ tilt = 'left', className = '' }) => {
  const rotation =
    tilt === 'left' ? '-2deg' : tilt === 'right' ? '2deg' : '-0.8deg';
  return (
    <span
      aria-hidden="true"
      style={{ transform: `translateX(-50%) rotate(${rotation})` }}
      className={`nb-tape-strip pointer-events-none select-none ${className}`}
    />
  );
};

export const PinDot: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`nb-pin-dot pointer-events-none select-none ${className}`}
  />
);
