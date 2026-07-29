'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Building } from '@/types';
import { useState } from 'react';

interface BuildingFormProps {
  building?: Partial<Building>;
  onSubmit?: (data: Partial<Building>) => void;
  onCancel?: () => void;
}

export function BuildingForm({ building, onSubmit, onCancel }: BuildingFormProps) {
  const [name, setName] = useState(building?.name || '');
  const [address, setAddress] = useState(building?.address || '');
  const [area, setArea] = useState(building?.total_area_m2?.toString() || '');
  const [numFloors, setNumFloors] = useState(building?.num_floors?.toString() || '');
  const [orientation, setOrientation] = useState(building?.orientation?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      name,
      address: address || null,
      total_area_m2: area ? parseFloat(area) : null,
      num_floors: numFloors ? parseInt(numFloors) : null,
      orientation: orientation ? parseFloat(orientation) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="b-name">Nome do Edifício</Label>
        <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-address">Morada</Label>
        <Input id="b-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="b-area">Área (m²)</Label>
          <Input id="b-area" type="number" step="0.01" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-floors">Nº Pisos</Label>
          <Input id="b-floors" type="number" value={numFloors} onChange={(e) => setNumFloors(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-orient">Orientação (°)</Label>
          <Input id="b-orient" type="number" step="0.01" value={orientation} onChange={(e) => setOrientation(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
