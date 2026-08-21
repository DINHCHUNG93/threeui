import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

import type { SectionCompositionProps } from "../maccess-elements/MaccessElements";

export type SectionsCollectionVariant =
  | "workflow"
  | "editorial-intro"
  | "newsletter-footer";

export type SectionsCollectionProps = SectionCompositionProps & {
  variant?: SectionsCollectionVariant;
};

const SECTION_VARIANTS = {
  workflow: lazy(() =>
    import("../maccess-elements/MaccessElements").then((module) => ({ default: module.WorkflowSection })),
  ),
  "editorial-intro": lazy(() =>
    import("../maccess-elements/MaccessElements").then((module) => ({ default: module.EditorialIntroSection })),
  ),
  "newsletter-footer": lazy(() =>
    import("../maccess-elements/MaccessElements").then((module) => ({ default: module.NewsletterFooterSection })),
  ),
} satisfies Record<SectionsCollectionVariant, LazyExoticComponent<ComponentType<SectionCompositionProps>>>;

export function SectionsCollection({ variant = "workflow", ...props }: SectionsCollectionProps) {
  const Variant = SECTION_VARIANTS[variant];

  return (
    <Suspense fallback={null}>
      <Variant {...props} />
    </Suspense>
  );
}
