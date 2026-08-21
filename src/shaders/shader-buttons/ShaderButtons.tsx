import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

import type { NeuformIsolatedEffectProps } from "../neuform-isolated/NeuformIsolatedEffects";

export type ShaderButtonVariant =
  | "star-portal"
  | "ignition-button"
  | "induction-button"
  | "plasma-button"
  | "tactile-button"
  | "uploading-button";

export type ShaderButtonsProps = NeuformIsolatedEffectProps & {
  variant?: ShaderButtonVariant;
};

const SHADER_BUTTON_VARIANTS = {
  "star-portal": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.StarPortal })),
  ),
  "ignition-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.IgnitionButton })),
  ),
  "induction-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.InductionButton })),
  ),
  "plasma-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.PlasmaButton })),
  ),
  "tactile-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.TactileButton })),
  ),
  "uploading-button": lazy(() =>
    import("../neuform-isolated/NeuformIsolatedEffects").then((module) => ({ default: module.ThinkingButton })),
  ),
} satisfies Record<ShaderButtonVariant, LazyExoticComponent<ComponentType<NeuformIsolatedEffectProps>>>;

export function ShaderButtons({ variant = "star-portal", ...props }: ShaderButtonsProps) {
  const Variant = SHADER_BUTTON_VARIANTS[variant];

  return (
    <Suspense fallback={null}>
      <Variant {...props} />
    </Suspense>
  );
}
