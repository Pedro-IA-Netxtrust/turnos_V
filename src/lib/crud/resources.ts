import { supabase } from '../lib/supabase';

export interface ResourceRow {
  id: string;
  type: 'CAMIONETA' | 'CASINO';
  code: string;
  name: string;
  is_active: boolean;
}

/**
 * Obtiene recursos activos por tipo
 */
export async function getActiveResources(type?: 'CAMIONETA' | 'CASINO'): Promise<ResourceRow[]> {
  let query = supabase.from('resources').select('*').eq('is_active', true);
  if (type) query = query.eq('type', type);
  
  const { data, error } = await query.order('code', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene asignaciones vigentes (opcional para dashboard de recursos)
 */
export async function getCurrentAssignments() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('resource_assignments')
    .select('*, resources(code, name), employees(first_name, last_name)')
    .lte('start_date', today)
    .gte('end_date', today);
    
  if (error) throw error;
  return data || [];
}

/**
 * Crea una nueva asignación de recurso
 */
export async function assignResource(data: any) {
  const { data: result, error } = await supabase
    .from('resource_assignments')
    .insert([data])
    .select()
    .single();

  if (error) {
    // Error P0002 es el código personalizado en el trigger SQL
    if (error.code === 'P0002') {
      throw new Error('Conflicto: El recurso ya está asignado en ese rango de fechas.');
    }
    throw error;
  }
  return result;
}

/**
 * Obtiene todas las asignaciones de un recurso
 */
export async function getResourceAssignments(resourceId: string) {
  const { data, error } = await supabase
    .from('resource_assignments')
    .select('*, employees(first_name, last_name)')
    .eq('resource_id', resourceId)
    .order('start_date', { ascending: true });
    
  if (error) throw error;
  return data || [];
}