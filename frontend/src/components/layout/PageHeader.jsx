// src/components/layout/PageHeader.jsx
// Standardized page header component providing scannable visual hierarchy.

import { cn } from "../../lib/utils";

export default function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
  children,
}) {
  return (
    <header className={cn("space-y-4 border-b border-[var(--color-line-default)] pb-6 sm:pb-8", className)}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 max-w-3xl">
          {badge && <div className="flex items-center gap-2">{badge}</div>}
          <h1 className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-ink-primary)] sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-end">
            {actions}
          </div>
        )}
      </div>

      {children}
    </header>
  );
}
