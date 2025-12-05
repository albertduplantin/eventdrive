'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
// TODO: Implement importVipsFromCSV function
// import { importVipsFromCSV } from '@/lib/actions/vips';

interface VipImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function VipImportDialog({ open, onOpenChange, onSuccess }: VipImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('Le fichier CSV est vide');
          return;
        }

        // Parse CSV (simple parser, assumes comma-separated)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};

          // Map headers to field names
          headers.forEach((header, index) => {
            const value = values[index] || '';
            switch (header.toLowerCase()) {
              case 'prénom':
              case 'prenom':
              case 'firstname':
                row.firstName = value;
                break;
              case 'nom':
              case 'lastname':
                row.lastName = value;
                break;
              case 'email':
                row.email = value;
                break;
              case 'téléphone':
              case 'telephone':
              case 'phone':
                row.phone = value;
                break;
              case 'organisation':
              case 'organization':
                row.organization = value;
                break;
              case 'titre':
              case 'title':
                row.title = value;
                break;
              case 'catégorie':
              case 'categorie':
              case 'category':
                row.category = value;
                break;
              case 'notes':
                row.notes = value;
                break;
            }
          });

          return row;
        });

        // Validate required fields
        const validData = data.filter(row => row.firstName && row.lastName);

        if (validData.length === 0) {
          toast.error('Aucune donnée valide trouvée (prénom et nom requis)');
          return;
        }

        setPreviewData(validData);
        toast.success(`${validData.length} VIP(s) prêt(s) à importer`);
      } catch (error) {
        toast.error('Erreur lors de la lecture du fichier');
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Aucune donnée à importer');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement importVipsFromCSV function
      toast.error('Fonctionnalité d\'import CSV en cours de développement');
      /* const result = await importVipsFromCSV(previewData);

      if (result.success) {
        toast.success(`${result.imported} VIP(s) importé(s) avec succès`);
        setPreviewData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'importation');
      } */
    } catch (error) {
      toast.error('Erreur lors de l\'importation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Importer des VIPs
          </DialogTitle>
          <DialogDescription>
            Importez vos VIPs depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 relative z-0">
          {/* Instructions */}
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900">Format du fichier CSV:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Première ligne: en-têtes des colonnes</li>
                  <li>Colonnes requises: <span className="font-semibold">Prénom, Nom</span></li>
                  <li>Colonnes optionnelles: Email, Téléphone, Organisation, Titre, Catégorie, Notes</li>
                  <li>Encodage: UTF-8</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-purple-50 hover:border-purple-400 transition-all"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-10 w-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez votre fichier
                </p>
                <p className="text-xs text-gray-500">CSV uniquement</p>
              </div>
              <input
                id="csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-gray-900">
                    {previewData.length} VIP(s) prêt(s) à importer
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </div>

              <div className="rounded-lg border-2 border-gray-200 bg-white max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Prénom</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Nom</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Email</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Organisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t hover:bg-purple-50/50">
                        <td className="px-4 py-2">{row.firstName}</td>
                        <td className="px-4 py-2">{row.lastName}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.email || '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.organization || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-4 py-2 text-xs text-center text-muted-foreground border-t bg-gray-50">
                    + {previewData.length - 10} autre(s) VIP(s)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || previewData.length === 0}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? 'Importation...' : `Importer ${previewData.length} VIP(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
