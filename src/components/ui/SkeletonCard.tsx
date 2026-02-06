const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-2xl bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-secondary to-muted ${className}`} />
);

export default SkeletonCard;
