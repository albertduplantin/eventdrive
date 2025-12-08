import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardSidebar } from '@/components/features/dashboard-sidebar';
import { DashboardHeader } from '@/components/features/dashboard-header';
import { ProfileCompletionModal } from '@/components/features/profile-completion-modal';

// Force all dashboard pages to be dynamic
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userData = await getCurrentUser();

  // Redirect to sign-in if not authenticated
  if (!userData?.clerkUser) {
    redirect('/sign-in');
  }

  // Redirect to onboarding if no database user
  if (userData.needsOnboarding) {
    redirect('/onboarding');
  }

  // Check if profile needs completion
  const needsProfileCompletion = !userData.dbUser?.phone ||
    (!userData.dbUser?.address &&
     (userData.dbUser?.role === 'DRIVER' || userData.dbUser?.role === 'VIP'));

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Profile Completion Modal */}
      {userData.dbUser && (
        <ProfileCompletionModal
          user={userData.dbUser}
          open={needsProfileCompletion}
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar user={userData.dbUser} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <DashboardHeader user={userData.dbUser} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
