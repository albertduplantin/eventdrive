'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { users } from '@/lib/db/schema';

interface DashboardHeaderProps {
  user: typeof users.$inferSelect | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md px-6 lg:px-8 shadow-sm">
      <div className="flex-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Bonjour, {user?.firstName || 'Utilisateur'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-black dark:bg-white ring-2 ring-white dark:ring-black" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-black/10 dark:border-white/10">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-11 h-11 ring-2 ring-black/10 dark:ring-white/10 hover:ring-black/20 dark:hover:ring-white/20 transition-all',
                userButtonPopoverCard: 'shadow-2xl',
                userButtonPopoverActionButton: 'hover:bg-black/5 dark:hover:bg-white/5',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
