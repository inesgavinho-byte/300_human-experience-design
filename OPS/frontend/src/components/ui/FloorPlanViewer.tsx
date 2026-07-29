'use client';

import { cn } from '@/lib/utils';

interface FloorPlanViewerProps {
  width?: number;
  height?: number;
  className?: string;
}

export function FloorPlanViewer({ width = 600, height = 400, className }: FloorPlanViewerProps) {
  const cols = 20;
  const rows = 14;
  const cellW = width / cols;
  const cellH = height / rows;

  // Simple mock floor plan: generate some "rooms" as colored rectangles on the grid
  const rooms = [
    { x: 2, y: 2, w: 6, h: 4, label: 'Sala' },
    { x: 9, y: 2, w: 4, h: 4, label: 'Cozinha' },
    { x: 2, y: 7, w: 5, h: 5, label: 'Suite' },
    { x: 8, y: 7, w: 4, h: 3, label: 'Q2' },
    { x: 13, y: 2, w: 5, h: 5, label: 'Escritório' },
    { x: 13, y: 8, w: 3, h: 4, label: 'WC' },
  ];

  return (
    <div
      className={cn('relative overflow-hidden rounded-md border bg-muted/30', className)}
      style={{ width, height }}
    >
      {/* Grid background */}
      <svg width={width} height={height} className="absolute inset-0">
        <defs>
          <pattern id="grid" width={cellW} height={cellH} patternUnits="userSpaceOnUse">
            <path d={`M ${cellW} 0 L 0 0 0 ${cellH}`} fill="none" stroke="currentColor" strokeOpacity={0.08} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
      </svg>

      {/* Room overlays */}
      {rooms.map((room, idx) => (
        <div
          key={idx}
          className="absolute flex items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-xs font-medium text-primary/80"
          style={{
            left: room.x * cellW + 2,
            top: room.y * cellH + 2,
            width: room.w * cellW - 4,
            height: room.h * cellH - 4,
          }}
        >
          {room.label}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 rounded-md border bg-card/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
        Planta 2D (preview)
      </div>
    </div>
  );
}
