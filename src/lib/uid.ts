export function generateUID(): string {
  // 12-char base36 timestamp + random suffix (safe for display)
  const ts = Math.floor(Date.now() / 1000).toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return (ts + rand).toUpperCase();
}
