// src/components/layout/Section.jsx
// Structural container primitive enforcing consistent responsive rhythm and width constraints.

import { cn } from "../../lib/utils";

const widthStyles = {
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

export default function Section({
  children,
  width = "default",
  className,
  as: Component = "section",
  ...props
}) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10",
        widthStyles[width] || widthStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
