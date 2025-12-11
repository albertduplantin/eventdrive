'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, useAuth } from '@clerk/nextjs';
import { MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvitationCode } from '@/lib/actions/invitations';
import { UserRole } from '@/types';

interface JoinPageClientProps {
  invitation: any;
  festival: any;
  code: string;
}

export function JoinPageClient({ invitation, festival, code }: JoinPageClientProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // If user is already signed in, automatically join
    if (isLoaded && isSignedIn && !joined && !loading) {
      handleJoin();
    }
  }, [isLoaded, isSignedIn]);

  async function handleJoin() {
    setLoading(true);
    try {
      const result = await useInvitationCode(code);
      if (result.success) {
        setJoined(true);
        // Store festival ID in localStorage for future visits
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastFestivalId', festival.id);
        }
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // If join failed, show error and stop loading
        console.error('Failed to join:', result.error);
        alert(result.error || 'Erreur lors de l\'inscription au festival');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error joining:', error);
      alert('Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
  }

  function getRoleLabel(role: UserRole | null): string {
    if (!role) return 'Membre';
    const labels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.FESTIVAL_ADMIN]: 'Admin Festival',
      [UserRole.GENERAL_COORDINATOR]: 'Coordinateur',
      [UserRole.VIP_MANAGER]: 'Responsable VIP',
      [UserRole.DRIVER_MANAGER]: 'Responsable Chauffeurs',
      [UserRole.DRIVER]: 'Chauffeur',
      [UserRole.VIP]: 'VIP',
    };
    return labels[role] || 'Membre';
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  // Success state
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-black/5 dark:from-black dark:to-white/5 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white dark:text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Bienvenue !</h2>
            <p className="text-muted-foreground mb-6">
              Vous avez rejoint <span className="font-semibold text-foreground">{festival.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Redirection vers votre dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not signed in state - show sign in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-black/5 dark:from-black dark:to-white/5 p-4">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Festival info */}
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black dark:bg-white shadow-lg">
                <MapPin className="h-6 w-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{festival.name}</h1>
              </div>
            </div>

            {festival.description && (
              <p className="text-lg text-muted-foreground">{festival.description}</p>
            )}

            <div className="space-y-3 rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vous êtes invité comme</p>
                <p className="text-xl font-bold">{getRoleLabel(invitation.role)}</p>
              </div>
              {festival.locationAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                  <p className="text-sm">{festival.locationAddress}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dates</p>
                <p className="text-sm">
                  Du {formatDate(festival.startDate)} au {formatDate(festival.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>Connectez-vous pour rejoindre le festival</span>
            </div>
          </div>

          {/* Right side - Sign in */}
          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-2xl',
                },
              }}
              routing="path"
              path={`/join/${code}`}
              signUpUrl={`/join/${code}`}
              afterSignInUrl={`/join/${code}`}
              afterSignUpUrl={`/join/${code}`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-black/5 dark:from-black dark:to-white/5 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center animate-pulse">
              <MapPin className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Inscription en cours...</h2>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous vous inscrivons au festival
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
