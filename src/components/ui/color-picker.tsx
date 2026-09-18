'use client';

import { BOARD_COLORS, cn } from '@/lib/utils';

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BOARD_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'h-7 w-7 rounded-full transition-transform',
            value === color ? 'scale-110 ring-2 ring-ink-900 ring-offset-2 ring-offset-surface' : 'hover:scale-105',
          )}
          style={{ backgroundColor: color }}
          aria-label={`Colour ${color}`}
          aria-pressed={value === color}
        />
      ))}
    </div>
  );
}
