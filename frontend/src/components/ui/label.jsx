// src/components/ui/label.jsx

import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn("mb-1.5 block text-sm font-medium text-[var(--foreground)]", className)}
      {...props}
    />
  );
}

export { Label };