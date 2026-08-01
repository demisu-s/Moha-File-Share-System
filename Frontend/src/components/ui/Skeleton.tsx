export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/5 rounded-md ${className}`} />;
}