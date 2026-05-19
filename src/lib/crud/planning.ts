import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const planningStatusEnum = z.enum(['P', 'T', 'V', 'L']);

const planningRecordSchema = z.object({
  employee_id: z.string().uuid(),
  plan_date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'plan_date must be a valid ISO date string',
  }),
  status: planningStatusEnum.optional().default('P'),
  hours_worked: z.number().min(0).max(12).optional().default(8),
  notes: z.string().nullable().optional(),
  approved_by: z.string().uuid().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
});

const bulkPlanningSchema = z
  .array(planningRecordSchema)
  .min(1)
  .superRefine((records, ctx) => {
    const futureLimit = Date.now() + 3 * 24 * 60 * 60 * 1000;
    const keys = new Set<string>();

    records.forEach((record, index) => {
      const date = Date.parse(record.plan_date);
      if (date > futureLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'plan_date'],
          message: 'plan_date cannot be more than 3 days in the future',
        });
      }

      const key = `${record.employee_id}:${record.plan_date}`;
      if (keys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'employee_id'],
          message: 'Duplicate employee_id and plan_date combination in payload',
        });
      }
      keys.add(key);
    });
  });

export type PlanningDailyRow = Database['public']['Tables']['planning_daily']['Row'];
export type PlanningDailyInsert = Database['public']['Tables']['planning_daily']['Insert'];

export async function getPlanningDailyByEmployee(
  employeeId: string,
  fromDate: string,
  toDate: string,
): Promise<PlanningDailyRow[]> {
  const { data, error } = await supabase
    .from('planning_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('plan_date', fromDate)
    .lte('plan_date', toDate)
    .order('plan_date', { ascending: true });

  if (error) {
    throw new Error(`getPlanningDailyByEmployee failed: ${error.message}`);
  }

  return data;
}

export async function getPlanningDailyByDateRange(
  employeeId: string,
  startDate: string,
  endDate: string,
): Promise<PlanningDailyRow[]> {
  const { data, error } = await supabase
    .from('planning_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .order('plan_date', { ascending: true });

  if (error) {
    throw new Error(`getPlanningDailyByDateRange failed: ${error.message}`);
  }

  return data;
}

export async function bulkUpsertPlanningDaily(
  records: unknown,
): Promise<PlanningDailyRow[]> {
  const parsedRecords = bulkPlanningSchema.parse(records) as Database['public']['Tables']['planning_daily']['Insert'][];

  const { data, error } = await supabase
    .from('planning_daily')
    .upsert(parsedRecords, { onConflict: 'employee_id,plan_date' })
    .select('*');

  if (error || !data) {
    throw new Error(`bulkUpsertPlanningDaily failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function getPlanningDailyByDate(
  employeeId: string,
  planDate: string,
): Promise<PlanningDailyRow | null> {
  const { data, error } = await supabase
    .from('planning_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('plan_date', planDate)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`getPlanningDailyByDate failed: ${error.message}`);
  }

  return data;
}

export async function upsertPlanningDaily(
  record: unknown,
): Promise<PlanningDailyRow> {
  const parsedRecord = planningRecordSchema.parse(record) as Database['public']['Tables']['planning_daily']['Insert'];

  const { data, error } = await supabase
    .from('planning_daily')
    .upsert(parsedRecord, { onConflict: 'employee_id,plan_date' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`upsertPlanningDaily failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function bulkInsertPlanningDaily(
  records: unknown,
): Promise<PlanningDailyRow[]> {
  const parsedRecords = bulkPlanningSchema.parse(records) as Database['public']['Tables']['planning_daily']['Insert'][];

  const { data, error } = await supabase
    .from('planning_daily')
    .insert(parsedRecords)
    .select('*');

  if (error || !data) {
    throw new Error(`bulkInsertPlanningDaily failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

/**
 * Elimina un registro de planificación por su ID
 */
export async function deletePlanningDaily(id: string): Promise<void> {
  const { error } = await supabase
    .from('planning_daily')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`deletePlanningDaily failed: ${error.message}`);
}

/**
 * Obtiene registros de planificación para múltiples empleados en un rango de fechas
 */
export async function getPlanningDailyBulk(
  employeeIds: string[],
  startDate: string,
  endDate: string,
): Promise<PlanningDailyRow[]> {
  const { data, error } = await supabase
    .from('planning_daily')
    .select('*')
    .in('employee_id', employeeIds)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate);

  if (error) throw new Error(`getPlanningDailyBulk failed: ${error.message}`);
  return data || [];
}

/**
 * Elimina un registro de planificación por empleado y fecha
 */
export async function deletePlanningDailyByDate(employeeId: string, planDate: string): Promise<void> {
  const { error } = await supabase
    .from('planning_daily')
    .delete()
    .eq('employee_id', employeeId)
    .eq('plan_date', planDate);

  if (error) throw new Error(`deletePlanningDailyByDate failed: ${error.message}`);
}

/**
 * Obtiene el total de horas reales trabajadas por todos los empleados de un área
 * en un mes y año específicos.
 * Filtra mediante un join (!inner) con la tabla de empleados.
 */
export async function getAreaActualHours(
  areaId: string,
  year: number,
  month: number,
): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('planning_daily')
    .select('hours_worked, employees!inner(area_id)')
    .eq('employees.area_id', areaId)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate);

  if (error) {
    throw new Error(`getAreaActualHours failed: ${error.message}`);
  }

  // Sumamos las horas de todos los registros encontrados
  return data.reduce((sum, row) => sum + Number(row.hours_worked), 0);
}

/**
 * Obtiene el total de horas reales trabajadas por todos los empleados activos
 * en un mes y año específicos para el resumen global del dashboard.
 */
export async function getGlobalActualHours(
  year: number,
  month: number,
): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('planning_daily')
    .select('hours_worked, employees!inner(is_active)')
    .eq('employees.is_active', true)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate);

  if (error) {
    throw new Error(`getGlobalActualHours failed: ${error.message}`);
  }

  return data.reduce((sum, row) => sum + Number(row.hours_worked), 0);
}
