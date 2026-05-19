import { supabase } from '@/lib/supabase';
import type { Database } from '../../types/supabase';

type PlanningDaily = Database['public']['Tables']['planning_daily']['Insert'];

/**
 * Registra la asistencia diaria de un empleado
 */
export async function saveDailyRegister(data: PlanningDaily) {
  // El trigger fn_validate_plan_date en la DB ya protege las reglas de fecha
  // El check constraint protege el límite de 12 horas
  const { data: result, error } = await supabase
    .from('planning_daily')
    .upsert(data, { 
      onConflict: 'employee_id,plan_date' 
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving daily register:', error);
    throw new Error(error.message);
  }

  return result;
}

/**
 * Obtiene el historial de registros de un empleado para un rango de fechas
 */
export async function getEmployeeHistory(employeeId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('planning_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .order('plan_date', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data;
}

/**
 * Elimina un registro (Auditoría automática por trigger)
 */
export async function deleteDailyRegister(id: string) {
  const { error } = await supabase
    .from('planning_daily')
    .delete()
    .eq('id', id);
  return { success: !error, error };
}