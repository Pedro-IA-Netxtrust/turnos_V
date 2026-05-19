import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const employeeMetricsCreateSchema = z.object({
  employee_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
  gender: z.enum(['M', 'F', 'O']).nullable().optional(),
  contract_type: z.enum(['FAENA', 'TELETRABAJO', 'MIXTO']).nullable().optional(),
  total_hours_worked: z.number().optional(),
  total_hours_faena: z.number().optional(),
  total_hours_telework: z.number().optional(),
  security_trainings_count: z.number().int().optional(),
  real_hours: z.number().nullable().optional(),
  target_hours: z.number().nullable().optional(),
  deviation_pct: z.number().nullable().optional(),
  alert_flag: z.boolean().optional(),
});

const employeeMetricsUpdateSchema = employeeMetricsCreateSchema.partial();

export type EmployeeMetricsRow = Database['public']['Tables']['employee_metrics']['Row'];
export type EmployeeMetricsInsert = Database['public']['Tables']['employee_metrics']['Insert'];

export async function getMetricsByEmployee(
  employeeId: string,
  year: number,
  month: number,
): Promise<EmployeeMetricsRow | null> {
  const { data, error } = await supabase
    .from('employee_metrics')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`getMetricsByEmployee failed: ${error.message}`);
  }

  return data;
}

export async function getMetricsByArea(
  areaId: string,
  year: number,
  month: number,
): Promise<EmployeeMetricsRow[]> {
  const { data, error } = await supabase
    .from('employee_metrics as em')
    .select('em.*, e.area_id')
    .eq('em.year', year)
    .eq('em.month', month)
    .eq('e.area_id', areaId);

  if (error) {
    throw new Error(`getMetricsByArea failed: ${error.message}`);
  }

  return data;
}

export async function getAlertedMetrics(year: number, month: number): Promise<EmployeeMetricsRow[]> {
  const { data, error } = await supabase
    .from('employee_metrics')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('alert_flag', true)
    .order('deviation_pct', { ascending: true });

  if (error) {
    throw new Error(`getAlertedMetrics failed: ${error.message}`);
  }

  return data;
}

export async function createEmployeeMetrics(input: unknown): Promise<EmployeeMetricsRow> {
  const parsed = employeeMetricsCreateSchema.parse(input) as EmployeeMetricsInsert;

  const { data, error } = await supabase
    .from('employee_metrics')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createEmployeeMetrics failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateEmployeeMetrics(id: string, input: unknown): Promise<EmployeeMetricsRow> {
  const parsed = employeeMetricsUpdateSchema.parse(input) as Partial<EmployeeMetricsInsert>;

  const { data, error } = await supabase
    .from('employee_metrics')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateEmployeeMetrics failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteEmployeeMetrics(id: string): Promise<void> {
  const { error } = await supabase.from('employee_metrics').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteEmployeeMetrics failed: ${error.message}`);
  }
}
