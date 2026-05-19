import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const weeklyPatternCreateSchema = z.object({
  name: z.string().min(1),
  area_id: z.string().uuid(),
  hours_mon: z.number().gte(0).lte(24),
  hours_tue: z.number().gte(0).lte(24),
  hours_wed: z.number().gte(0).lte(24),
  hours_thu: z.number().gte(0).lte(24),
  hours_fri: z.number().gte(0).lte(24),
  hours_sat: z.number().gte(0).lte(24),
  hours_sun: z.number().gte(0).lte(24),
  is_default: z.boolean().optional().default(false),
});

const weeklyPatternUpdateSchema = weeklyPatternCreateSchema.partial();

export type WeeklyPatternRow = Database['public']['Tables']['weekly_patterns']['Row'];
export type WeeklyPatternInsert = Database['public']['Tables']['weekly_patterns']['Insert'];
export type WeeklyPatternUpdate = Database['public']['Tables']['weekly_patterns']['Update'];

export async function getWeeklyPatternsByArea(areaId: string): Promise<WeeklyPatternRow[]> {
  const { data, error } = await supabase
    .from('weekly_patterns')
    .select('*')
    .eq('area_id', areaId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`getWeeklyPatternsByArea failed: ${error.message}`);
  }

  return data;
}

export async function getDefaultWeeklyPattern(areaId: string): Promise<WeeklyPatternRow | null> {
  const { data, error } = await supabase
    .from('weekly_patterns')
    .select('*')
    .eq('area_id', areaId)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`getDefaultWeeklyPattern failed: ${error.message}`);
  }

  return data;
}

export async function createWeeklyPattern(input: unknown): Promise<WeeklyPatternRow> {
  const parsed = weeklyPatternCreateSchema.parse(input) as WeeklyPatternInsert;

  const { data, error } = await supabase
    .from('weekly_patterns')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createWeeklyPattern failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateWeeklyPattern(id: string, input: unknown): Promise<WeeklyPatternRow> {
  const parsed = weeklyPatternUpdateSchema.parse(input) as WeeklyPatternUpdate;

  const { data, error } = await supabase
    .from('weekly_patterns')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateWeeklyPattern failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteWeeklyPattern(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_patterns').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteWeeklyPattern failed: ${error.message}`);
  }
}
