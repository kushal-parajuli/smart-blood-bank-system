// src/components/common/Avatar.jsx
//
// Consistent generic avatar fallback (a plain user silhouette icon)
// for anyone without a profile picture — deliberately identical for everyone,
// not personalized initials, per project architecture decisions.

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Avatar({ src, alt = "User avatar", className }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setImgError(true)}
        className={cn("h-10 w-10 rounded-full object-cover shrink-0", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--primary)] shrink-0",
        className
      )}
      aria-label={alt}
    >
      <User size={20} className="stroke-[2.2]" />
    </div>
  );
}
