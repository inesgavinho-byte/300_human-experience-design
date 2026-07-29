'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockEquipmentLibrary, mockSuppliers } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  iluminacao: 'Iluminação',
  climatizacao: 'Climatização',
  avac: 'AVAC',
  domotica: 'Domótica',
  seguranca: 'Segurança',
  audio: 'Áudio',
  video: 'Vídeo',
  rede: 'Rede',
  energia: 'Energia',
  agua: 'Água',
  automation: 'Automação',
  outro: 'Outro',
};

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockEquipmentLibrary.filter((item) => {
      const matchesSearch =
        !search ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.reference.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Equipamentos</h1>
        <p className="text-muted-foreground">Catálogo técnico 300 OPS</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por marca, referência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={[
          {
            key: 'brand',
            header: 'Marca',
            cell: (row) => <span className="font-medium">{row.brand}</span>,
          },
          {
            key: 'reference',
            header: 'Referência',
            cell: (row) => <span className="font-mono text-xs">{row.reference}</span>,
          },
          {
            key: 'category',
            header: 'Categoria',
            cell: (row) => <Badge variant="outline">{categoryLabels[row.category] || row.category}</Badge>,
          },
          {
            key: 'price',
            header: 'Preço',
            cell: (row) => (
              <span className="text-sm">
                {row.net_price
                  ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: row.currency }).format(row.net_price)
                  : '-'}
              </span>
            ),
          },
          {
            key: 'supplier',
            header: 'Fornecedor',
            cell: (row) => (
              <span className="text-sm">
                {mockSuppliers.find((s) => s.id === row.supplier_id)?.name || '-'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            cell: (row) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedItem(row.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          {(() => {
            const row = mockEquipmentLibrary.find((i) => i.id === selectedItem);
            if (!row) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{row.brand} {row.reference}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Categoria:</span>
                      <p>{categoryLabels[row.category] || row.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preço:</span>
                      <p>
                        {row.net_price
                          ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: row.currency }).format(row.net_price)
                          : '-'}
                      </p>
                    </div>
                  </div>
                  {row.description && (
                    <div>
                      <span className="text-muted-foreground">Descrição:</span>
                      <p>{row.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Potência:</span>
                      <p>{row.power_w ? `${row.power_w}W` : '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tensão:</span>
                      <p>{row.voltage_v ? `${row.voltage_v}V` : '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Protocolos:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.protocols.map((p) => (
                        <Badge key={String(p)} variant="secondary">{String(p)}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IP Rating:</span>
                    <p>{row.ip_rating || '-'}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
