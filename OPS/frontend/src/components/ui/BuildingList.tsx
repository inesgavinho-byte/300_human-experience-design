'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Building } from '@/types';
import { Building2, Layers, MapPin } from 'lucide-react';

interface BuildingListProps {
  buildings: Building[];
}

export function BuildingList({ buildings }: BuildingListProps) {
  if (buildings.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Sem edifícios registados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {buildings.map((building) => (
        <Card key={building.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{building.name}</CardTitle>
                  {building.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{building.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="gap-1">
                <Layers className="h-3 w-3" />
                {building.num_floors ?? 0} pisos
              </Badge>
              {building.total_area_m2 && (
                <Badge variant="outline">
                  {building.total_area_m2} m²
                </Badge>
              )}
              {building.orientation !== null && (
                <Badge variant="outline">
                  Orientação {building.orientation}°
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
