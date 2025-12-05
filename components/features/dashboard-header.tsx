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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 lg:px-8 shadow-sm">
      <div className="flex-1">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Bonjour, {user?.firstName || 'Utilisateur'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
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
          className="relative h-11 w-11 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 ring-2 ring-white" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-11 h-11 ring-2 ring-purple-100 hover:ring-purple-300 transition-all',
                userButtonPopoverCard: 'shadow-2xl',
                userButtonPopoverActionButton: 'hover:bg-purple-50',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
