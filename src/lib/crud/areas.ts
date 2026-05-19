import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const areaCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

const areaUpdateSchema = areaCreateSchema.partial();

export type AreaRow = Database['public']['Tables']['areas']['Row'];
export type AreaInsert = Database['public']['Tables']['areas']['Insert'];
export type AreaUpdate = Database['public']['Tables']['areas']['Update'];

export async function getActiveAreas(): Promise<AreaRow[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`getActiveAreas failed: ${error.message}`);
  }

  return data;
}

export async function createArea(input: unknown): Promise<AreaRow> {
  const parsed = areaCreateSchema.parse(input) as AreaInsert;

  const { data, error } = await supabase
    .from('areas')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createArea failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateArea(id: string, input: unknown): Promise<AreaRow> {
  const parsed = areaUpdateSchema.parse(input) as AreaUpdate;

  const { data, error } = await supabase
    .from('areas')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateArea failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteArea(id: string): Promise<void> {
  const { error } = await supabase.from('areas').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteArea failed: ${error.message}`);
  }
}
