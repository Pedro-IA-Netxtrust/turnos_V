import { supabase } from '../supabase';

export type AuditLogEntry = {
  id: number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string | null;
  changed_at: string;
};

/**
 * Obtiene el historial de auditoría para un registro específico
 */
export async function getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('changed_at', { ascending: false });

  if (error) {
    throw new Error(`getAuditLogsForRecord failed: ${error.message}`);
  }

  return data || [];
}