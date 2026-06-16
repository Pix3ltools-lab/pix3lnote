'use client';

import { useState } from 'react';
import { ChecklistItem } from '@/types/note';

interface ChecklistSectionProps {
  items: ChecklistItem[];
  canEdit: boolean;
  onAddItem: (text: string) => Promise<void>;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onChangeItemText: (itemId: string, text: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export function ChecklistSection({
  items, canEdit, onAddItem, onToggleItem, onChangeItemText, onDeleteItem,
}: ChecklistSectionProps) {
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = async () => {
    const text = newItemText.trim();
    if (!text) return;
    setNewItemText('');
    await onAddItem(text);
  };

  return (
    <div className="px-4 pb-2">
      {items.map(item => (
        <div key={item.id} className="group flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => onToggleItem(item.id, e.target.checked)}
            disabled={!canEdit}
            className="h-4 w-4 flex-shrink-0 rounded accent-violet-600"
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => onChangeItemText(item.id, e.target.value)}
            disabled={!canEdit}
            style={{ backgroundColor: 'transparent' }}
            className={`flex-1 text-sm outline-none ${item.checked ? 'line-through opacity-50' : ''}`}
          />
          {canEdit && (
            <button
              onClick={() => onDeleteItem(item.id)}
              title="Remove item"
              className="flex-shrink-0 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
            >×</button>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="flex items-center gap-2 py-1">
          <span className="h-4 w-4 flex-shrink-0 rounded border border-current opacity-30" />
          <input
            type="text"
            placeholder="Add item…"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            onBlur={handleAdd}
            style={{ backgroundColor: 'transparent' }}
            className="flex-1 text-sm placeholder-current placeholder-opacity-40 outline-none"
          />
        </div>
      )}
    </div>
  );
}
