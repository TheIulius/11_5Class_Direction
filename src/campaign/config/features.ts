/**
 * Central Feature Flags for Komarovi 11/5 Platform
 * Controls section availability, locking, and maintenance states.
 */

export interface SectionFeatureConfig {
  locked: boolean;
  lockMessage: string;
}

export const FEATURE_FLAGS: Record<'opportunities' | 'ideas' | 'clubs', SectionFeatureConfig> = {
  // Locked per requirements with exact lowercase "coming soon!"
  opportunities: {
    locked: true,
    lockMessage: 'coming soon!',
  },
  ideas: {
    locked: true,
    lockMessage: 'coming soon!',
  },
  clubs: {
    locked: true,
    lockMessage: 'coming soon!',
  },
};

export function isSectionLocked(section: 'opportunities' | 'ideas' | 'clubs'): boolean {
  return Boolean(FEATURE_FLAGS[section]?.locked);
}
