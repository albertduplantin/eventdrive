'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DriverMap } from '@/components/tracking/driver-map';

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/missions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-black">
            Suivi en Temps Réel
          </h1>
          <p className="text-muted-foreground mt-1">
            Position de votre chauffeur
          </p>
        </div>
      </div>

      {/* Map Component */}
      <DriverMap missionId={missionId} />
    </div>
  );
}
