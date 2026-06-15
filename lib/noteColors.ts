import { NoteColor } from '@/types/note';

export const NOTE_COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string }> = {
  default: { bg: '#ffffff', border: '#e5e7eb', text: '#111827' },
  red:     { bg: '#f28b82', border: '#ef9a9a', text: '#111827' },
  orange:  { bg: '#fbbc04', border: '#fbbf24', text: '#111827' },
  yellow:  { bg: '#fff475', border: '#fde047', text: '#111827' },
  green:   { bg: '#ccff90', border: '#86efac', text: '#111827' },
  teal:    { bg: '#a7ffeb', border: '#5eead4', text: '#111827' },
  blue:    { bg: '#cbf0f8', border: '#93c5fd', text: '#111827' },
  purple:  { bg: '#d7aefb', border: '#c084fc', text: '#111827' },
  pink:    { bg: '#fdcfe8', border: '#f9a8d4', text: '#111827' },
  brown:   { bg: '#e6c9a8', border: '#d4a574', text: '#111827' },
  gray:    { bg: '#e8eaed', border: '#9ca3af', text: '#111827' },
};

export const DARK_NOTE_COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string }> = {
  default: { bg: '#3c3c3c', border: '#525252', text: '#f9fafb' },
  red:     { bg: '#f28b82', border: '#ef9a9a', text: '#1f1f1f' },
  orange:  { bg: '#fbbc04', border: '#fbbf24', text: '#1f1f1f' },
  yellow:  { bg: '#fff475', border: '#fde047', text: '#1f1f1f' },
  green:   { bg: '#ccff90', border: '#86efac', text: '#1f1f1f' },
  teal:    { bg: '#a7ffeb', border: '#5eead4', text: '#1f1f1f' },
  blue:    { bg: '#cbf0f8', border: '#93c5fd', text: '#1f1f1f' },
  purple:  { bg: '#d7aefb', border: '#c084fc', text: '#1f1f1f' },
  pink:    { bg: '#fdcfe8', border: '#f9a8d4', text: '#1f1f1f' },
  brown:   { bg: '#e6c9a8', border: '#d4a574', text: '#1f1f1f' },
  gray:    { bg: '#3c3f45', border: '#52555e', text: '#f3f4f6' },
};
