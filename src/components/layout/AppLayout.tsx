import { ReactNode } from 'react';
import BottomNav from './BottomNav';

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background font-body">
      <main className="pb-20 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
