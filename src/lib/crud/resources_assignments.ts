import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const resourceAssignmentCreateSchema = z.object({
  employee_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  assignment_date: z.string(),
  duration_days: z.number().int().min(1).max(365),
  notes: z.string().nullable().optional(),
  assigned_by: z.string().nullable().optional(),
});

const resourceAssignmentUpdateSchema = resourceAssignmentCreateSchema.partial();

export type ResourceAssignmentRow = Database['public']['Tables']['resource_assignments']['Row'];
export type ResourceAssignmentInsert = Database['public']['Tables']['resource_assignments']['Insert'];

export async function getAssignmentsByEmployee(employeeId: string): Promise<ResourceAssignmentRow[]> {
  const { data, error } = await supabase
    .from('resource_assignments')
    .select('*')
    .eq('employee_id', employeeId)
    .order('assignment_date', { ascending: false });

  if (error) {
    throw new Error(`getAssignmentsByEmployee failed: ${error.message}`);
  }

  return data;
}

export async function getAssignmentsByResource(resourceId: string): Promise<ResourceAssignmentRow[]> {
  const { data, error } = await supabase
    .from('resource_assignments')
    .select('*')
    .eq('resource_id', resourceId)
    .order('assignment_date', { ascending: true });

  if (error) {
    throw new Error(`getAssignmentsByResource failed: ${error.message}`);
  }

  return data;
}

export async function getAssignmentsByDate(
  resourceId: string,
  startDate: string,
  endDate: string,
): Promise<ResourceAssignmentRow[]> {
  const { data, error } = await supabase
    .from('resource_assignments')
    .select('*')
    .eq('resource_id', resourceId)
    .gte('assignment_date', startDate)
    .lte('assignment_date', endDate);

  if (error) {
    throw new Error(`getAssignmentsByDate failed: ${error.message}`);
  }

  return data;
}

export async function createResourceAssignment(input: unknown): Promise<ResourceAssignmentRow> {
  const parsed = resourceAssignmentCreateSchema.parse(input) as ResourceAssignmentInsert;

  const { data, error } = await supabase
    .from('resource_assignments')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createResourceAssignment failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateResourceAssignment(
  id: string,
  input: unknown,
): Promise<ResourceAssignmentRow> {
  const parsed = resourceAssignmentUpdateSchema.parse(input) as Partial<ResourceAssignmentInsert>;

  const { data, error } = await supabase
    .from('resource_assignments')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateResourceAssignment failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteResourceAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('resource_assignments').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteResourceAssignment failed: ${error.message}`);
  }
}
