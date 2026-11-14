import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sparkles, Palette, RotateCcw } from 'lucide-react';

export type DesignPreviewMode = 'original' | 'notebook';
export type NotebookAccentToken = 'purple' | 'blue';

interface DesignPreviewContextValue {
  designMode: DesignPreviewMode;
  setDesignMode: (mode: DesignPreviewMode) => void;
  toggleDesignMode: () => void;
  accentToken: NotebookAccentToken;
  setAccentToken: (accent: NotebookAccentToken) => void;
  isNotebook: boolean;
}

const DesignPreviewContext = createContext<DesignPreviewContextValue>({
  designMode: 'notebook',
  setDesignMode: () => {},
  toggleDesignMode: () => {},
  accentToken: 'purple',
  setAccentToken: () => {},
  isNotebook: true,
});

export const useDesignPreview = () => useContext(DesignPreviewContext);

/**
 * Design theme provider.
 * Defaults to the KomClub Purple Notebook design ('notebook' + 'purple').
 * Supports optional ?preview=original or ?accent=blue via URL query params.
 */
export const DesignPreviewProvider: React.FC<{
  children: React.ReactNode;
  onModeChange?: (mode: DesignPreviewMode) => void;
}> = ({ children, onModeChange }) => {
  const [designMode, setDesignModeState] = useState<DesignPreviewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('preview') || params.get('design');
      if (q === 'original') return 'original';
      if (q === 'notebook') return 'notebook';
    }
    return 'notebook';
  });

  const [accentToken, setAccentToken] = useState<NotebookAccentToken>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('accent') === 'blue') return 'blue';
    }
    return 'purple';
  });

  const setDesignMode = (mode: DesignPreviewMode) => {
    setDesignModeState(mode);
    if (onModeChange) onModeChange(mode);
  };

  const toggleDesignMode = () => {
    const next: DesignPreviewMode = designMode === 'notebook' ? 'original' : 'notebook';
    setDesignMode(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (designMode === 'notebook') {
      root.setAttribute('data-design-preview', 'notebook');
      root.setAttribute('data-notebook-accent', accentToken);
    } else {
      root.removeAttribute('data-design-preview');
      root.removeAttribute('data-notebook-accent');
    }
    return () => {
      root.removeAttribute('data-design-preview');
      root.removeAttribute('data-notebook-accent');
    };
  }, [designMode, accentToken]);

  return (
    <DesignPreviewContext.Provider
      value={{
        designMode,
        setDesignMode,
        toggleDesignMode,
        accentToken,
        setAccentToken,
        isNotebook: designMode === 'notebook',
      }}
    >
      {children}
    </DesignPreviewContext.Provider>
  );
};

/**
 * Visible local preview switcher: "Original / Notebook preview" + Accent Token comparator.
 * Placed cleanly above mobile bottom nav or in bottom-left corner on desktop.
 */
export const DesignPreviewSwitcher: React.FC = () => {
  const { designMode, setDesignMode, accentToken, setAccentToken, isNotebook } = useDesignPreview();
  const [showSwitcher] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('switcher') === '1' || params.get('debug') === 'design';
    }
    return false;
  });

  if (!showSwitcher) return null;

  return (
    <div
      role="region"
      aria-label="დიზაინის ექსპერიმენტის გადამრთველი"
      className="nb-preview-switcher fixed z-[60] right-3 sm:right-auto sm:left-5 bottom-[4.6rem] lg:bottom-5 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl shadow-xl transition-all select-none max-w-[calc(100vw-1.5rem)]"
      style={{
        backgroundColor: isNotebook ? '#fff9c4' : 'rgba(17, 31, 51, 0.94)',
        border: isNotebook ? '2.5px solid #2d2d2d' : '1px solid rgba(255,255,255,0.16)',
        boxShadow: isNotebook ? '4px 4px 0 0 #2d2d2d' : '0 10px 28px rgba(0,0,0,0.38)',
        borderRadius: isNotebook ? '22px 10px 20px 12px / 12px 20px 10px 22px' : '16px',
        color: isNotebook ? '#2d2d2d' : '#E9EEF4',
      }}
    >
      <div className="flex items-center gap-1" role="group" aria-label="Original / Notebook preview">
        <button
          type="button"
          onClick={() => setDesignMode('original')}
          aria-pressed={designMode === 'original'}
          className="min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
          style={{
            backgroundColor: designMode === 'original' ? '#326CAD' : 'transparent',
            color: designMode === 'original' ? '#ffffff' : isNotebook ? '#2d2d2d' : '#A5B3C4',
            borderRadius: isNotebook ? '14px 6px 12px 8px / 8px 12px 6px 14px' : '10px',
            border: designMode === 'original' ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
          }}
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Original</span>
        </button>

        <button
          type="button"
          onClick={() => setDesignMode('notebook')}
          aria-pressed={designMode === 'notebook'}
          className="min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
          style={{
            backgroundColor:
              designMode === 'notebook'
                ? accentToken === 'purple'
                  ? '#7b2ff7'
                  : '#1d63d8'
                : 'transparent',
            color: designMode === 'notebook' ? '#ffffff' : '#E9EEF4',
            borderRadius: isNotebook ? '14px 6px 12px 8px / 8px 12px 6px 14px' : '10px',
            border: designMode === 'notebook' ? '2px solid #2d2d2d' : '1px solid rgba(255,255,255,0.14)',
            boxShadow: designMode === 'notebook' ? '2px 2px 0 0 #2d2d2d' : 'none',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Notebook preview</span>
        </button>
      </div>

      {isNotebook && (
        <div
          className="flex items-center gap-1 pl-1.5 border-l border-[#2d2d2d]/25"
          role="group"
          aria-label="აქცენტის ფერის შედარება"
        >
          <Palette className="w-3.5 h-3.5 text-[#2d2d2d] ml-0.5 shrink-0" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setAccentToken('purple')}
            aria-pressed={accentToken === 'purple'}
            title="KomClub Purple (#7b2ff7)"
            className="min-h-[34px] px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-all"
            style={{
              backgroundColor: accentToken === 'purple' ? '#7b2ff7' : '#ffffff',
              color: accentToken === 'purple' ? '#ffffff' : '#2d2d2d',
              border: '2px solid #2d2d2d',
              borderRadius: '12px 5px 11px 6px / 6px 11px 5px 12px',
              boxShadow: accentToken === 'purple' ? '1px 1px 0 0 #2d2d2d' : 'none',
            }}
          >
            Purple
          </button>
          <button
            type="button"
            onClick={() => setAccentToken('blue')}
            aria-pressed={accentToken === 'blue'}
            title="11⁵ Blue (#1d63d8)"
            className="min-h-[34px] px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-all"
            style={{
              backgroundColor: accentToken === 'blue' ? '#1d63d8' : '#ffffff',
              color: accentToken === 'blue' ? '#ffffff' : '#2d2d2d',
              border: '2px solid #2d2d2d',
              borderRadius: '12px 5px 11px 6px / 6px 11px 5px 12px',
              boxShadow: accentToken === 'blue' ? '1px 1px 0 0 #2d2d2d' : 'none',
            }}
          >
            11⁵ Blue
          </button>
        </div>
      )}
    </div>
  );
};
