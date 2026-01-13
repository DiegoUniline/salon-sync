import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <Header />
      
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          // Desktop: account for sidebar
          'md:pl-[70px]',
          !sidebarCollapsed && 'md:pl-[260px]'
        )}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
