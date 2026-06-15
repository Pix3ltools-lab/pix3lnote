import { z } from 'zod';
import { NOTE_COLORS } from '@/types/note';

export const createNoteSchema = z.object({
  title: z.string().max(500).optional().default(''),
  content: z.string().max(20000).optional().default(''),
  color: z.enum(NOTE_COLORS).optional().default('default'),
  is_pinned: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(20000).optional(),
  color: z.enum(NOTE_COLORS).optional(),
  is_pinned: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#8b5cf6'),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const labelActionSchema = z.object({
  labelId: z.string().min(1),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
