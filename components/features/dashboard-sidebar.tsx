'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Calendar,
  Settings,
  Bell,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { cn, hasPermission } from '@/lib/utils';
import { UserRole } from '@/types';
import type { users } from '@/lib/db/schema';

interface DashboardSidebarProps {
  user: typeof users.$inferSelect | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: keyof typeof import('@/types').PERMISSIONS;
}

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'VIPs',
    href: '/dashboard/vips',
    icon: Users,
    requiredPermission: 'VIEW_VIPS',
  },
  {
    label: 'Transports',
    href: '/dashboard/transports',
    icon: MapPin,
    requiredPermission: 'CREATE_TRANSPORT_REQUEST',
  },
  {
    label: 'Chauffeurs',
    href: '/dashboard/drivers',
    icon: Car,
    requiredPermission: 'VIEW_DRIVERS',
  },
  {
    label: 'Affectations',
    href: '/dashboard/missions',
    icon: Calendar,
    requiredPermission: 'ASSIGN_DRIVERS',
  },
  {
    label: 'Suivi temps réel',
    href: '/dashboard/tracking',
    icon: MapPin,
    requiredPermission: 'VIEW_REAL_TIME_TRACKING',
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    label: 'Rapports',
    href: '/dashboard/reports',
    icon: BarChart3,
    requiredPermission: 'VIEW_ANALYTICS',
  },
  {
    label: 'Gestion utilisateurs',
    href: '/dashboard/settings/users',
    icon: Users,
    requiredPermission: 'MANAGE_USERS',
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const userRole = user?.role as UserRole;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(userRole, item.requiredPermission);
  });

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center px-6 border-b border-black/10 dark:border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
            <MapPin className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">
              FestivalDrive
            </span>
            <p className="text-xs text-muted-foreground">Gestion VIP</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                  : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Role Badge */}
      <div className="p-4 border-t border-black/10 dark:border-white/10">
        <div className="rounded-lg bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Votre rôle</p>
          <p className="text-sm font-bold">
            {getRoleLabel(userRole)}
          </p>
          {user?.firstName && (
            <p className="text-xs text-muted-foreground mt-2">
              {user.firstName} {user.lastName}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 flex-col bg-white dark:bg-black border-r border-black/10 dark:border-white/10 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-black shadow-2xl transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.FESTIVAL_ADMIN]: 'Admin Festival',
    [UserRole.GENERAL_COORDINATOR]: 'Coordinateur',
    [UserRole.VIP_MANAGER]: 'Responsable VIP',
    [UserRole.DRIVER_MANAGER]: 'Responsable Chauffeurs',
    [UserRole.DRIVER]: 'Chauffeur',
    [UserRole.VIP]: 'VIP',
  };
  return labels[role] || role;
}
