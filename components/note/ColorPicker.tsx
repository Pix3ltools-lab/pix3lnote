'use client';

import { NOTE_COLORS, NoteColor } from '@/types/note';
import { NOTE_COLOR_MAP } from '@/lib/noteColors';

interface ColorPickerProps {
  current: NoteColor;
  onChange: (color: NoteColor) => void;
}

export function ColorPicker({ current, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {NOTE_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          title={color}
          style={{ backgroundColor: NOTE_COLOR_MAP[color].bg, borderColor: NOTE_COLOR_MAP[color].border }}
          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
            current === color ? 'ring-2 ring-violet-500 ring-offset-1' : ''
          }`}
        />
      ))}
    </div>
  );
}
