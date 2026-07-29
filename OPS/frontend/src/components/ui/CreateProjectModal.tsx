'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BuildingType, BudgetFlexibility, SolutionLevel } from '@/types';
import { useState } from 'react';
import { Plus } from 'lucide-react';

const buildingTypes: { value: BuildingType; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'villa_grande', label: 'Villa Grande' },
  { value: 'edificio_multifamiliar', label: 'Edifício Multifamiliar' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'aparthotel', label: 'Aparthotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'retail', label: 'Retail' },
  { value: 'espaco_saude', label: 'Espaço Saúde' },
  { value: 'residencia_senior', label: 'Residência Sénior' },
];

const budgetOptions: { value: BudgetFlexibility; label: string }[] = [
  { value: 'fixed', label: 'Fixo' },
  { value: 'flexible_10', label: 'Flexível +10%' },
  { value: 'flexible_20', label: 'Flexível +20%' },
  { value: 'open', label: 'Aberto' },
];

const solutionLevels: { value: SolutionLevel; label: string }[] = [
  { value: 'essential', label: 'Essential' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'signature', label: 'Signature' },
];

interface CreateProjectModalProps {
  onCreate?: (data: {
    name: string;
    building_type: BuildingType;
    budget_flexibility: BudgetFlexibility;
    solution_level: SolutionLevel;
    total_area_m2?: number;
    budget_total?: number;
  }) => void;
}

export function CreateProjectModal({ onCreate }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [buildingType, setBuildingType] = useState<BuildingType>('apartamento');
  const [budgetFlexibility, setBudgetFlexibility] = useState<BudgetFlexibility>('fixed');
  const [solutionLevel, setSolutionLevel] = useState<SolutionLevel>('recommended');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate?.({
      name,
      building_type: buildingType,
      budget_flexibility: budgetFlexibility,
      solution_level: solutionLevel,
      total_area_m2: area ? parseFloat(area) : undefined,
      budget_total: budget ? parseFloat(budget) : undefined,
    });
    setOpen(false);
    setName('');
    setArea('');
    setBudget('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos do projeto. Poderá adicionar mais detalhes depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Edifício Liberdade — T4 Premium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipologia</Label>
            <Select value={buildingType} onValueChange={(v) => setBuildingType(v as BuildingType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildingTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="285.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento (€)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="145000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetFlex">Flexibilidade</Label>
              <Select value={budgetFlexibility} onValueChange={(v) => setBudgetFlexibility(v as BudgetFlexibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solutionLevel">Nível de Solução</Label>
              <Select value={solutionLevel} onValueChange={(v) => setSolutionLevel(v as SolutionLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {solutionLevels.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Projeto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
