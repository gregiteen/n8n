import { Sidebar } from '@/components/layout/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Sidebar>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </Sidebar>
  );
}
