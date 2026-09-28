// src/utils/imageUrl.js
// Resolves relative backend upload URLs to fully-qualified asset URLs.

export function getFullImageUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}
