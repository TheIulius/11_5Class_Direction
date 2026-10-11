---
name: ios-fluid-gestures
description: Mandates framer-motion or vaul for mobile slide-overs and bottom sheets, enforces GPU-accelerated transform translateY instead of height animations, requires hardware acceleration (will-change-transform), and dictates authentic iOS-standard spring physics (stiffness ~400, damping ~40).
metadata:
  model: inherit
---

# iOS Fluid Gestures Skill (`ios-fluid-gesturesSKILL`)

Standardized engineering and UX specification for crafting buttery-smooth, 60fps/120fps iOS-native gestural interfaces, bottom sheets, slide-overs, and stacked drawers in React web applications.

---

## Use this skill when

- Designing or implementing mobile bottom sheets, drawers, action sheets, slide-overs, or stacked modal cards.
- Refactoring animations to eliminate layout reflow, stutter, or mobile WebKit frame drops.
- Implementing drag-to-dismiss, snap points, rubber-band bounce, or swipe-driven interactions.
- Configuring physics-based spring animations to achieve an authentic Apple iOS feel.
- Coordinating multi-tier drawer states (e.g. `closed`, `peek`, `expanded`, `stacked`).

## Do not use this skill when

- Building desktop-only non-gestural layouts (e.g. traditional static sidebars or standard table grids).
- Implementing purely decorative non-interactive canvas animations.

---

## Core Mandates & Non-Negotiable Directives

### Mandate 1: Animation Engine — `framer-motion` or `vaul` Exclusively
- **Requirement:** All mobile slide-overs, drawers, and gestural panels MUST be powered by `framer-motion` (or `vaul` when dedicated unopinionated snap-point primitives are specified).
- Never use raw CSS `@keyframes` with `height` / `max-height` or arbitrary CSS classes for gesture handling.
- Always wrap conditional mounts in `<AnimatePresence mode="wait">` (or standard `AnimatePresence`) to ensure fluid exit transitions.

### Mandate 2: GPU Transform (`translateY`) vs. Layout Reflow (`height`)
- **NEVER animate `height`, `max-height`, `top`, or `bottom`.**
  - Animating layout dimensions triggers synchronous CPU reflow (layout calculation) and repaints across the entire document tree, degrading framerates on mobile devices.
- **ALWAYS animate `transform: translateY(...)`:**
  - Enter: `initial={{ y: "100%" }} animate={{ y: 0 }}`
  - Exit: `exit={{ y: "100%" }}`
  - `transform` transitions are offloaded entirely to the GPU compositor thread, guaranteeing sustained 60fps/120fps even during complex DOM rendering.

### Mandate 3: Hardware Acceleration & Composite Layer Promotion
- Always apply hardware acceleration to sliding sheets and backdrops:
  - Tailwind: `will-change-transform` or inline `style={{ willChange: "transform", transform: "translateZ(0)" }}`.
  - Stacking Context: Ensure `isolation: isolate` is present on drawers and sticky modals to prevent unexpected z-index bleeds.

### Mandate 4: Authentic iOS-Standard Spring Physics
CSS `ease-in-out` curves feel artificial and robotic. iOS interface physics rely on damped harmonic oscillators. All transitions and gesture releases must strictly use spring physics:

1. **Standard iOS Sheet Presentation / Dismissal:**
   ```typescript
   transition: {
     type: "spring",
     stiffness: 400,
     damping: 40,
     mass: 1
   }
   ```
2. **Heavy / Multi-Tier Stacked Drawers (e.g., Substitutes & Chips Drawers):**
   ```typescript
   transition: {
     type: "spring",
     stiffness: 120,
     damping: 20
   }
   ```
3. **Quick Popovers / Action Alerts / Micro-Interactions:**
   ```typescript
   transition: {
     type: "spring",
     stiffness: 500,
     damping: 35
   }
   ```

### Mandate 5: Gestural Drag, Elastic Bounds & Dismissal Thresholds
- **Vertical Drag Setup:**
  - `drag="y"`
  - `dragConstraints={{ top: 0, bottom: 0 }}`
  - `dragElastic={{ top: 0.1, bottom: 0.6 }}` (simulates iOS rubber-banding when dragged upward past maximum bounds).
- **Velocity & Offset Detection:**
  - Dismiss sheet if dragged down past a distance threshold (e.g., `offset.y > 120`) OR if the user flicks downward with a velocity threshold (`velocity.y > 400`).
  - If thresholds are not exceeded, the spring physics automatically snaps the sheet back into its resting state without jarring layout shifts.

### Mandate 6: Authentic iOS Visual Signifiers & Safe Areas
1. **Drag Handle (Capsule Pill):**
   ```tsx
   <div className="w-12 h-1 bg-white/20 dark:bg-white/20 rounded-full mx-auto my-3 pointer-events-none" />
   ```
   Add `touch-none` (CSS `touch-action: none`) to the handle wrapper to prevent native Safari browser pull-to-refresh interference while dragging.
2. **iOS Safe Area Inset Support:**
   Always include bottom padding that respects the iOS home bar:
   ```tsx
   className="pb-[max(1rem,env(safe-area-inset-bottom))]"
   ```
3. **Ultra-Glass Backdrop & Surface:**
   ```tsx
   // Backdrop
   <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
   />

   // Sheet surface
   <motion.div className="fixed bottom-0 inset-x-0 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-2xl z-50 will-change-transform">
   ```

---

## Reference Implementations

### Pattern 1: Complete Production-Ready iOS Bottom Sheet (`framer-motion`)

```tsx
import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface IOSBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const IOSBottomSheet: React.FC<IOSBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Dismiss if dragged down > 120px or flicked down with velocity > 400
    if (info.offset.y > 120 || info.velocity.y > 400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              mass: 1,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.65 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 inset-x-0 max-w-lg mx-auto bg-zinc-950/85 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-2xl z-50 will-change-transform flex flex-col max-h-[88vh] pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {/* Grab Handle Header */}
            <div className="w-full pt-3 pb-2 touch-none cursor-grab active:cursor-grabbing select-none flex flex-col items-center">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
              {title && (
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase text-zinc-400">
                  {title}
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-2 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

---

### Pattern 2: Stacked Tiered Drawers (e.g. Substitutes & Chips Drawers)

When stacking multiple contextual sheets (e.g., Primary "Substitutes" drawer with secondary "Chips & Transfers" underneath):

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StackedTieredDrawers: React.FC = () => {
  const [activeTier, setActiveTier] = useState<'collapsed' | 'peek' | 'full'>('peek');

  // Height snap points translated to Y offsets
  const tierVariants = {
    collapsed: { y: 'calc(100% - 64px)' },
    peek: { y: 'calc(100% - 240px)' },
    full: { y: 0 },
  };

  return (
    <motion.div
      variants={tierVariants}
      initial="peek"
      animate={activeTier}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (info.velocity.y < -300 || info.offset.y < -80) {
          setActiveTier('full');
        } else if (info.velocity.y > 300 || info.offset.y > 80) {
          setActiveTier(activeTier === 'full' ? 'peek' : 'collapsed');
        }
      }}
      className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl will-change-transform pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {/* iOS Drag Indicator */}
      <div className="pt-3 pb-2 touch-none flex justify-center">
        <div className="w-12 h-1 bg-white/20 rounded-full" />
      </div>

      <div className="p-4">
        {/* Tier content */}
      </div>
    </motion.div>
  );
};
```

---

### Pattern 3: Unopinionated Snap-Point Drawer with `vaul`

When `vaul` is installed, use it for zero-boilerplate iOS snap points and background scaling:

```tsx
import { Drawer } from 'vaul';

export const VaulIOSSheet = ({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) => {
  return (
    <Drawer.Root shouldScaleBackground>
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] max-h-[92vh] flex flex-col will-change-transform pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-12 h-1 flex-shrink-0 rounded-full bg-white/20 my-3" />
          <div className="p-4 overflow-y-auto flex-1">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
```

---

## Verification & QA Checklist

Before concluding any mobile gestural refactor, verify against these criteria:

1. [ ] **No Layout Reflows:** No CSS animations on `height`, `max-height`, `margin`, or `padding`. `transform: translateY` is exclusively used.
2. [ ] **Hardware Acceleration Active:** The container has `will-change-transform` or `transform: translateZ(0)`.
3. [ ] **Physics Specs:** Spring parameters are set to `stiffness: ~400, damping: ~40` (or `stiffness: 120, damping: 20` for tiered stack).
4. [ ] **iOS Drag Handle:** Pill handle (`w-12 h-1 bg-white/20 rounded-full`) is centered at top with `touch-none`.
5. [ ] **Safe Area Inset:** Bottom padding includes `pb-[max(1rem,env(safe-area-inset-bottom))]`.
6. [ ] **Flick to Dismiss:** Fast downward drag velocities (`velocity.y > 400`) dismiss cleanly regardless of distance dragged.
7. [ ] **Rubber Band Elasticity:** `dragElastic` prevents jarring hard stops when pulled upwards.
