import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

import {
  MaccessGlassButton as DarkGlassRectangle,
  type SectionCompositionProps,
} from "../maccess-elements/MaccessElements";
import type { LumenCtaProps } from "../lumen-cta/LumenCta";
import type { NeuformIsolatedEffectProps } from "../neuform-isolated/NeuformIsolatedEffects";

export type RectangleButtonVariant =
  | "dark-pill"
  | "launch-button"
  | "dot-border-button"
  | "floating-dots-cta"
  | "sliding-text-cta"
  | "gradient-beam-cta"
  | "gradient-pill-button"
  | "generate-button"
  | "glassmorphism-cta"
  | "spinning-border-button"
  | "gradient-cta"
  | "lumen-cta"
  | "lumen-cta-ghost";

type IsolatedRectangleVariant = Exclude<
  RectangleButtonVariant,
  "dark-pill" | "lumen-cta" | "lumen-cta-ghost"
>;

export type RectangleButtonsProps = SectionCompositionProps &
  NeuformIsolatedEffectProps &
  Omit<LumenCtaProps, "variant"> & {
    variant?: RectangleButtonVariant;
  };

const LumenCta = lazy(() =>
  import("../lumen-cta/LumenCta").then((module) => ({ default: module.LumenCta })),
);

const RECTANGLE_VARIANTS = {
  "launch-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.LaunchButton })),
  ),
  "dot-border-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.DotBorderButton })),
  ),
  "floating-dots-cta": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.FloatingDotsCta })),
  ),
  "sliding-text-cta": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.SlidingTextCta })),
  ),
  "gradient-beam-cta": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.GradientBeamCta })),
  ),
  "gradient-pill-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.GradientPillButton })),
  ),
  "generate-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.GenerateButton })),
  ),
  "glassmorphism-cta": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.GlassmorphismCta })),
  ),
  "spinning-border-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.SpinningBorderButton })),
  ),
  "gradient-cta": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.GradientCta })),
  ),
} satisfies Record<IsolatedRectangleVariant, LazyExoticComponent<ComponentType<NeuformIsolatedEffectProps>>>;

export function RectangleButtons({ variant = "dark-pill", ...props }: RectangleButtonsProps) {
  if (variant === "dark-pill") {
    return <DarkGlassRectangle className={props.className} style={props.style} />;
  }

  if (variant === "lumen-cta" || variant === "lumen-cta-ghost") {
    return (
      <Suspense fallback={null}>
        <LumenCta {...props} variant={variant === "lumen-cta-ghost" ? "ghost" : "primary"} />
      </Suspense>
    );
  }

  const Variant = RECTANGLE_VARIANTS[variant];
  return (
    <Suspense fallback={null}>
      <Variant {...props} />
    </Suspense>
  );
}

/** @deprecated Use RectangleButtons. */
export const MaccessGlassButton = RectangleButtons;
/** @deprecated Use RectangleButtonsProps. */
export type MaccessGlassButtonProps = RectangleButtonsProps;
/** @deprecated Use RectangleButtonVariant. */
export type MaccessGlassButtonVariant = RectangleButtonVariant;
