import { validateInvitationCode } from '@/lib/actions/invitations';
import { JoinPageClient } from '@/components/features/join-page-client';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;

  // Validate invitation code
  const result = await validateInvitationCode(code);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-black/5 dark:from-black dark:to-white/5 p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold">Invitation invalide</h1>
            <p className="text-muted-foreground">
              {result.error || 'Ce code d\'invitation n\'est pas valide ou a expiré.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <JoinPageClient invitation={result.data.invitation} festival={result.data.festival} code={code} />;
}
