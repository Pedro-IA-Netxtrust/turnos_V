import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const securityTrainingCreateSchema = z.object({
  employee_id: z.string().uuid(),
  training_date: z.string(),
  topic: z.string().min(1),
  duration_hours: z.number().positive(),
  instructor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const securityTrainingUpdateSchema = securityTrainingCreateSchema.partial();

export type SecurityTrainingRow = Database['public']['Tables']['security_training']['Row'];
export type SecurityTrainingInsert = Database['public']['Tables']['security_training']['Insert'];

export async function getTrainingsByEmployee(employeeId: string): Promise<SecurityTrainingRow[]> {
  const { data, error } = await supabase
    .from('security_training')
    .select('*')
    .eq('employee_id', employeeId)
    .order('training_date', { ascending: false });

  if (error) {
    throw new Error(`getTrainingsByEmployee failed: ${error.message}`);
  }

  return data;
}

export async function getTrainingByPeriod(
  employeeId: string,
  startDate: string,
  endDate: string,
): Promise<SecurityTrainingRow[]> {
  const { data, error } = await supabase
    .from('security_training')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('training_date', startDate)
    .lte('training_date', endDate)
    .order('training_date', { ascending: true });

  if (error) {
    throw new Error(`getTrainingByPeriod failed: ${error.message}`);
  }

  return data;
}

export async function createSecurityTraining(input: unknown): Promise<SecurityTrainingRow> {
  const parsed = securityTrainingCreateSchema.parse(input) as SecurityTrainingInsert;

  const { data, error } = await supabase
    .from('security_training')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createSecurityTraining failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateSecurityTraining(id: string, input: unknown): Promise<SecurityTrainingRow> {
  const parsed = securityTrainingUpdateSchema.parse(input) as Partial<SecurityTrainingInsert>;

  const { data, error } = await supabase
    .from('security_training')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateSecurityTraining failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteSecurityTraining(id: string): Promise<void> {
  const { error } = await supabase.from('security_training').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteSecurityTraining failed: ${error.message}`);
  }
}
