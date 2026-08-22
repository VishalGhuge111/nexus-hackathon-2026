export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }): React.ReactElement {
  return <div className={`skeleton-shimmer rounded-md ${className}`} style={style} />;
}
