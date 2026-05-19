import { supabase } from '@/lib/supabase';

export type EmployeeLookup = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
};

/**
 * Obtiene la lista de empleados activos para selectores
 */
export async function getActiveEmployees(): Promise<EmployeeLookup[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name')
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  if (error) throw error;
  return data || [];
}