export function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmedUrl = url.trim();
  
  // If it's already a 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmedUrl)) return trimmedUrl;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmedUrl.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;
  
  return id;
}
