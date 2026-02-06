import { Crown } from 'lucide-react';

const PremiumBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full gradient-gold text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
    <Crown className="w-3 h-3" />
    Premium
  </span>
);

export default PremiumBadge;
