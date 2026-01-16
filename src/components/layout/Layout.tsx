import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionBlockedModal } from '@/components/SubscriptionBlockedModal';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useApp();
  const { subscription, isSubscriptionExpired, daysRemaining } = usePermissions();

  return (
    <div className="min-h-screen bg-background">
      {/* Subscription blocked modal */}
      <SubscriptionBlockedModal open={isSubscriptionExpired} />
      
      {/* Trial/Expiration banner */}
      {subscription && daysRemaining !== null && !isSubscriptionExpired && (
        <TrialBanner 
          daysRemaining={daysRemaining} 
          status={subscription.status} 
          planName={subscription.plan}
        />
      )}
      
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
