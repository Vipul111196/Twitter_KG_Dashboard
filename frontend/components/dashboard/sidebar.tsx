'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Hash, Network, Home } from 'lucide-react';

/**
 * Dashboard Sidebar Navigation
 * 
 * Provides main navigation for the dashboard with active state indicators.
 */

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Network',
    href: '/network',
    icon: Network,
  },
  {
    name: 'Hashtags',
    href: '/hashtags',
    icon: Hash,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Network className="mr-3 h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">Twitter Analytics</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Powered by Neo4j + GraphQL
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} Twitter Analytics
          </p>
        </div>
      </div>
    </aside>
  );
}

