import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
// import { OnboardingFormWithInvitation } from '@/components/features/onboarding-form-with-invitation';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const userData = await getCurrentUser();

  // If user already has a database record, redirect to dashboard
  if (userData?.dbUser) {
    redirect('/dashboard');
  }

  // Serialize only the data needed from clerkUser
  const userInfo = userData?.clerkUser ? {
    id: userData.clerkUser.id,
    email: userData.clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: userData.clerkUser.firstName || '',
    lastName: userData.clerkUser.lastName || '',
  } : null;

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-black/10 dark:bg-white/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <h1 className="text-5xl font-bold mb-2 tracking-tight">
              Bienvenue sur FestivalDrive
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Configurez votre compte pour commencer a gerer vos transports VIP
          </p>
        </div>
        {/* <OnboardingFormWithInvitation userInfo={userInfo} /> */}
        <p>Onboarding temporairement désactivé - utilisez les liens d&apos;invitation</p>
      </div>
    </div>
  );
}
