// Centralized category palette and theme-specific styling for the calendar and related badges
export interface CategoryStyle {
  label: string;
  dotColor: string;
  // Light mode styles
  bgLight: string;
  borderLight: string;
  textLight: string;
  // Dark mode styles
  bgDark: string;
  borderDark: string;
  textDark: string;
  // Solid color representation for charts / accents
  hexColor: string;
}

export const CATEGORY_PALETTE: Record<string, CategoryStyle> = {
  // შემაჯამებელი: muted coral / rose
  'შემაჯამებელი': {
    label: 'შემაჯამებელი',
    dotColor: '#E05353',
    bgLight: 'rgba(224, 83, 83, 0.12)',
    borderLight: 'rgba(224, 83, 83, 0.30)',
    textLight: '#B91C1C',
    bgDark: 'rgba(239, 68, 68, 0.22)',
    borderDark: 'rgba(239, 68, 68, 0.45)',
    textDark: '#FCA5A5',
    hexColor: '#E05353',
  },
  // დავალება / დავალებები: soft amber / warm gold
  'დავალება': {
    label: 'დავალება',
    dotColor: '#D97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    borderLight: 'rgba(217, 119, 6, 0.30)',
    textLight: '#B45309',
    bgDark: 'rgba(245, 158, 11, 0.22)',
    borderDark: 'rgba(245, 158, 11, 0.45)',
    textDark: '#FDE68A',
    hexColor: '#D97706',
  },
  'დავალებები': {
    label: 'დავალებები',
    dotColor: '#D97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    borderLight: 'rgba(217, 119, 6, 0.30)',
    textLight: '#B45309',
    bgDark: 'rgba(245, 158, 11, 0.22)',
    borderDark: 'rgba(245, 158, 11, 0.45)',
    textDark: '#FDE68A',
    hexColor: '#D97706',
  },
  // ტესტი: muted lavender
  'ტესტი': {
    label: 'ტესტი',
    dotColor: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.12)',
    borderLight: 'rgba(139, 92, 246, 0.30)',
    textLight: '#6D28D9',
    bgDark: 'rgba(167, 139, 250, 0.22)',
    borderDark: 'rgba(167, 139, 250, 0.45)',
    textDark: '#DDD6FE',
    hexColor: '#8B5CF6',
  },
  // დამოუკიდებელი: clear blue
  'დამოუკიდებელი': {
    label: 'დამოუკიდებელი',
    dotColor: '#2563EB',
    bgLight: 'rgba(37, 99, 235, 0.12)',
    borderLight: 'rgba(37, 99, 235, 0.30)',
    textLight: '#1D4ED8',
    bgDark: 'rgba(59, 130, 246, 0.22)',
    borderDark: 'rgba(59, 130, 246, 0.45)',
    textDark: '#BFDBFE',
    hexColor: '#2563EB',
  },
  // გამოკითხვა: dusty teal
  'გამოკითხვა': {
    label: 'გამოკითხვა',
    dotColor: '#0D9488',
    bgLight: 'rgba(13, 148, 136, 0.12)',
    borderLight: 'rgba(13, 148, 136, 0.30)',
    textLight: '#0F766E',
    bgDark: 'rgba(45, 212, 191, 0.22)',
    borderDark: 'rgba(45, 212, 191, 0.45)',
    textDark: '#99F6E4',
    hexColor: '#0D9488',
  },
  // ჩემპიონატები: deep forest / emerald
  'ჩემპიონატები': {
    label: 'ჩემპიონატები',
    dotColor: '#16A34A',
    bgLight: 'rgba(22, 163, 74, 0.12)',
    borderLight: 'rgba(22, 163, 74, 0.30)',
    textLight: '#15803D',
    bgDark: 'rgba(34, 197, 94, 0.22)',
    borderDark: 'rgba(34, 197, 94, 0.45)',
    textDark: '#BBF7D0',
    hexColor: '#16A34A',
  },
  // ჰაკათონები/იდეათონები: vibrant mint
  'ჰაკათონები/იდეათონები': {
    label: 'ჰაკათონები/იდეათონები',
    dotColor: '#059669',
    bgLight: 'rgba(5, 150, 105, 0.12)',
    borderLight: 'rgba(5, 150, 105, 0.30)',
    textLight: '#047857',
    bgDark: 'rgba(52, 211, 153, 0.22)',
    borderDark: 'rgba(52, 211, 153, 0.45)',
    textDark: '#A7F3D0',
    hexColor: '#059669',
  },
  // ოლიმპიადები: sky / cyan
  'ოლიმპიადები': {
    label: 'ოლიმპიადები',
    dotColor: '#0284C7',
    bgLight: 'rgba(2, 132, 199, 0.12)',
    borderLight: 'rgba(2, 132, 199, 0.30)',
    textLight: '#0369A1',
    bgDark: 'rgba(56, 189, 248, 0.22)',
    borderDark: 'rgba(56, 189, 248, 0.45)',
    textDark: '#BAE6FD',
    hexColor: '#0284C7',
  },
  // აქტივობები: gentle violet
  'აქტივობები': {
    label: 'აქტივობები',
    dotColor: '#9333EA',
    bgLight: 'rgba(147, 51, 234, 0.12)',
    borderLight: 'rgba(147, 51, 234, 0.30)',
    textLight: '#7E22CE',
    bgDark: 'rgba(192, 132, 252, 0.22)',
    borderDark: 'rgba(192, 132, 252, 0.45)',
    textDark: '#E9D5FF',
    hexColor: '#9333EA',
  },
  // მოხალისეობრივი: warm sunflower
  'მოხალისეობრივი': {
    label: 'მოხალისეობრივი',
    dotColor: '#CA8A04',
    bgLight: 'rgba(202, 138, 4, 0.12)',
    borderLight: 'rgba(202, 138, 4, 0.30)',
    textLight: '#A16207',
    bgDark: 'rgba(250, 204, 21, 0.22)',
    borderDark: 'rgba(250, 204, 21, 0.45)',
    textDark: '#FEF08A',
    hexColor: '#CA8A04',
  },
  // პრე-აქსელერაციის პროგრამები: azure cyan
  'პრე-აქსელერაციის პროგრამები': {
    label: 'პრე-აქსელერაცია',
    dotColor: '#0891B2',
    bgLight: 'rgba(8, 145, 178, 0.12)',
    borderLight: 'rgba(8, 145, 178, 0.30)',
    textLight: '#0E7490',
    bgDark: 'rgba(34, 211, 238, 0.22)',
    borderDark: 'rgba(34, 211, 238, 0.45)',
    textDark: '#A5F3FC',
    hexColor: '#0891B2',
  },
  // სკოლა: refined blue
  'სკოლა': {
    label: 'სასკოლო',
    dotColor: '#326CAD',
    bgLight: 'rgba(50, 108, 173, 0.12)',
    borderLight: 'rgba(50, 108, 173, 0.30)',
    textLight: '#1E40AF',
    bgDark: 'rgba(54, 123, 196, 0.22)',
    borderDark: 'rgba(54, 123, 196, 0.45)',
    textDark: '#93C5FD',
    hexColor: '#326CAD',
  },
  // შეჯიბრებები: matching sports
  'შეჯიბრებები': {
    label: 'შეჯიბრებები',
    dotColor: '#16A34A',
    bgLight: 'rgba(22, 163, 74, 0.12)',
    borderLight: 'rgba(22, 163, 74, 0.30)',
    textLight: '#15803D',
    bgDark: 'rgba(34, 197, 94, 0.22)',
    borderDark: 'rgba(34, 197, 94, 0.45)',
    textDark: '#BBF7D0',
    hexColor: '#16A34A',
  },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  label: 'სხვა',
  dotColor: '#64748B',
  bgLight: 'rgba(100, 116, 139, 0.12)',
  borderLight: 'rgba(100, 116, 139, 0.28)',
  textLight: '#334155',
  bgDark: 'rgba(148, 163, 184, 0.20)',
  borderDark: 'rgba(148, 163, 184, 0.40)',
  textDark: '#CBD5E1',
  hexColor: '#64748B',
};

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return DEFAULT_CATEGORY_STYLE;
  return CATEGORY_PALETTE[category] || DEFAULT_CATEGORY_STYLE;
}

export function getCategoryInlineStyle(category: string | undefined, isDark: boolean): React.CSSProperties {
  const style = getCategoryStyle(category);
  return {
    backgroundColor: isDark ? style.bgDark : style.bgLight,
    borderColor: isDark ? style.borderDark : style.borderLight,
    color: isDark ? style.textDark : style.textLight,
  };
}
