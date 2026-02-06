import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Radio, PlaySquare, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/browse', label: 'Browse', icon: Search },
  { path: '/live', label: 'Live', icon: Radio },
  { path: '/my-videos', label: 'My Videos', icon: PlaySquare },
  { path: '/profile', label: 'Profile', icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-3 right-3 h-0.5 rounded-full gradient-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-body transition-colors ${
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
