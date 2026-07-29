import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Room } from '@/types';
import { DoorOpen, Eye, EyeOff, Sun, Droplets, Accessibility, Wrench, Users } from 'lucide-react';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const detectionIcon = {
    confirmed: <Eye className="h-4 w-4 text-success" />,
    detected: <Eye className="h-4 w-4 text-info" />,
    inferred: <EyeOff className="h-4 w-4 text-warning" />,
    to_confirm: <EyeOff className="h-4 w-4 text-muted-foreground" />,
    unavailable: <EyeOff className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{room.name}</CardTitle>
          {detectionIcon[room.detection_state]}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{room.function}</span>
          {room.area_m2 && <span>• {room.area_m2} m²</span>}
          {room.orientation && <span>• {room.orientation.toUpperCase()}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {room.has_windows && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Sun className="h-3 w-3" />
              {room.num_windows} janelas
            </Badge>
          )}
          {room.has_balcony && (
            <Badge variant="outline" className="gap-1 text-xs">
              <DoorOpen className="h-3 w-3" />
              Varanda
            </Badge>
          )}
          {room.is_wet_zone && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Droplets className="h-3 w-3" />
              Zona húmida
            </Badge>
          )}
          {room.is_circulation && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Accessibility className="h-3 w-3" />
              Circulação
            </Badge>
          )}
          {room.is_technical && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Wrench className="h-3 w-3" />
              Técnica
            </Badge>
          )}
          {room.is_staff_area && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              Staff
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
