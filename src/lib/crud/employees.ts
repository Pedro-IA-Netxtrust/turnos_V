import { z } from 'zod';
import { supabase } from '../supabase';
import type { Database } from '../types/database.types';

const employeeCreateSchema = z.object({
  employee_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  area_id: z.string().uuid(),
  position: z.string().nullable().optional(),
  fte_percentage: z.number().gt(0).lte(100).optional().default(100),
  gender: z.enum(['M', 'F', 'O']).nullable().optional(),
  contract_type: z.enum(['FAENA', 'TELETRABAJO', 'MIXTO']).optional().default('FAENA'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
  hire_date: z.string().nullable().optional(),
});

const employeeUpdateSchema = employeeCreateSchema.partial();

export type EmployeeRow = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export async function getActiveEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  if (error) {
    throw new Error(`getActiveEmployees failed: ${error.message}`);
  }

  return data;
}

export async function getEmployeesByArea(areaId: string): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .eq('area_id', areaId)
    .order('last_name', { ascending: true });

  if (error) {
    throw new Error(`getEmployeesByArea failed: ${error.message}`);
  }

  return data;
}

export async function getEmployeeById(id: string): Promise<EmployeeRow | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`getEmployeeById failed: ${error.message}`);
  }

  return data;
}

export async function createEmployee(input: unknown): Promise<EmployeeRow> {
  const parsed = employeeCreateSchema.parse(input) as EmployeeInsert;

  const { data, error } = await supabase
    .from('employees')
    .insert(parsed)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`createEmployee failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function updateEmployee(id: string, input: unknown): Promise<EmployeeRow> {
  const parsed = employeeUpdateSchema.parse(input) as EmployeeUpdate;

  const { data, error } = await supabase
    .from('employees')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`updateEmployee failed: ${error?.message ?? 'no data returned'}`);
  }

  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteEmployee failed: ${error.message}`);
  }
}
