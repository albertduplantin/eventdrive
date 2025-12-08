'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserRole } from '@/types';

interface QRCodeDialogProps {
  invitation: {
    id: string;
    code: string;
    role: UserRole | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDialog({ invitation, open, onOpenChange }: QRCodeDialogProps) {
  if (!invitation) return null;

  const invitationLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${invitation.code}`;

  function getRoleLabel(role: UserRole | null): string {
    if (!role) return 'Tous les rôles';
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

  function handleDownload() {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob || !invitation) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invitation-${invitation.code}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>QR Code d&apos;invitation</DialogTitle>
          <DialogDescription>
            Scannez ce code pour rejoindre le festival
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-xl border-4 border-black/10 dark:border-white/10 bg-white p-6">
              <QRCodeSVG
                id="qr-code-svg"
                value={invitationLink}
                size={256}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Code</p>
              <p className="text-lg font-bold font-mono">{invitation.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rôle</p>
              <p className="text-lg font-medium">{getRoleLabel(invitation.role)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lien</p>
              <p className="text-sm font-mono break-all text-muted-foreground">{invitationLink}</p>
            </div>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Télécharger le QR Code
          </Button>

          {/* Usage Hint */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Imprimez ce QR code sur des badges ou des affiches</p>
            <p>pour faciliter l&apos;inscription de vos invités</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
