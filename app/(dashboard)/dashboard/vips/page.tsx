'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileDown, Upload, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VipFormDialog } from '@/components/features/vip-form-dialog';
import { VipImportDialog } from '@/components/features/vip-import-dialog';
import { getVips, deleteVip } from '@/lib/actions/vips';
import { toast } from 'sonner';
import type { vips } from '@/lib/db/schema';

export default function VipsPage() {
  const router = useRouter();
  const [vipList, setVipList] = useState<Array<typeof vips.$inferSelect>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedVip, setSelectedVip] = useState<typeof vips.$inferSelect | null>(null);

  const loadVips = async () => {
    setIsLoading(true);
    try {
      const result = await getVips(searchQuery);
      if (result.success) {
        setVipList(result.vips);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des VIPs');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des VIPs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVips();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      loadVips();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce VIP ?')) {
      return;
    }

    const result = await deleteVip(id);
    if (result.success) {
      toast.success('VIP supprimé avec succès');
      loadVips();
    } else {
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (vip: typeof vips.$inferSelect) => {
    setSelectedVip(vip);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    router.push('/dashboard/vips/new');
  };

  const handleFormSuccess = () => {
    loadVips();
  };

  const exportToCSV = () => {
    if (vipList.length === 0) {
      toast.error('Aucun VIP à exporter');
      return;
    }

    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Organisation', 'Titre', 'Catégorie', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...vipList.map(vip =>
        [
          vip.firstName,
          vip.lastName,
          vip.email || '',
          vip.phone || '',
          vip.organization || '',
          vip.title || '',
          vip.category || '',
          vip.notes || '',
        ]
          .map(field => `"${field}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vips_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export réussi');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestion des VIPs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos invités VIP et leurs informations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="border-2 hover:border-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="border-2 hover:border-purple-500"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un VIP
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, prénom, email ou organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-2 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-50 hover:to-blue-50">
              <TableHead className="font-semibold text-gray-900">Nom</TableHead>
              <TableHead className="font-semibold text-gray-900">Prénom</TableHead>
              <TableHead className="font-semibold text-gray-900">Email</TableHead>
              <TableHead className="font-semibold text-gray-900">Téléphone</TableHead>
              <TableHead className="font-semibold text-gray-900">Organisation</TableHead>
              <TableHead className="font-semibold text-gray-900">Catégorie</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : vipList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Aucun VIP trouvé' : 'Aucun VIP enregistré'}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={handleAdd}
                        variant="outline"
                        className="mt-2 border-2 hover:border-purple-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre premier VIP
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vipList.map((vip) => (
                <TableRow key={vip.id} className="hover:bg-purple-50/50 transition-colors">
                  <TableCell className="font-medium">{vip.lastName}</TableCell>
                  <TableCell>{vip.firstName}</TableCell>
                  <TableCell className="text-muted-foreground">{vip.email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{vip.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{vip.organization || '—'}</TableCell>
                  <TableCell>
                    {vip.category ? (
                      <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        {vip.category}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(vip)}
                        className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(vip.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      {vipList.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-gray-900">{vipList.length}</span> VIP{vipList.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Form Dialog */}
      <VipFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vip={selectedVip}
        onSuccess={handleFormSuccess}
      />

      {/* Import Dialog */}
      <VipImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
