'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold text-black mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page non trouvée
        </h2>
        <p className="text-muted-foreground mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Retour au tableau de bord
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
