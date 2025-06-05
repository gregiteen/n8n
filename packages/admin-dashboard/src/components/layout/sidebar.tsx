'use client';

import { 
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Bot,
  Workflow,
  Shield,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'System Health', href: '/monitoring', icon: Activity },
  { name: 'AI Agents', href: '/agents', icon: Bot },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Privacy', href: '/privacy', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const NavigationItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto border-r bg-card">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-foreground">
              AI Agent Admin
            </h1>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-1">
              <NavigationItems />
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="fixed inset-0 flex z-40">
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
                 onClick={() => setIsMobileMenuOpen(false)} />
          )}
          
          <div className={cn(
            "relative flex-1 flex flex-col max-w-xs w-full bg-card transform transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-foreground">
                  AI Agent Admin
                </h1>
              </div>
              <nav className="mt-5 flex-1 px-3 space-y-1">
                <NavigationItems />
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
