import { supabase } from '../supabase';

/**
 * Registra una charla de seguridad para un empleado
 */
export async function registerSafetyTalk(data: {
  employee_id: string;
  talk_date: string;
  topic: string;
}) {
  const { error } = await supabase
    .from('safety_talks')
    .insert([data]);

  if (error) throw error;
  return true;
}

/**
 * Obtiene el conteo total de charlas realizadas en un mes
 */
export async function getMonthlySafetyCount(year: number, month: number): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('safety_talks')
    .select('*', { count: 'exact', head: true })
    .gte('talk_date', startDate)
    .lte('talk_date', endDate);

  if (error) {
    console.error("Error fetching safety count:", error);
    return 0;
  }

  return count || 0;
}