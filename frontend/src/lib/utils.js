    // src/lib/utils.js
//
// Standard shadcn/ui utility — merges Tailwind classes intelligently
// (e.g. cn("px-2", condition && "px-4") resolves to just "px-4", not
// both). Every shadcn-style component in components/ui/ uses this.

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}