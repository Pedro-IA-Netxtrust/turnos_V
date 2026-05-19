import React, { useEffect, useState } from 'react';
import { getAuditLogsForRecord, type AuditLogEntry } from '../lib/crud/audit';

interface Props {
  recordId: string;
  tableName: string;
  onClose: () => void;
}

export const AuditLogViewer: React.FC<Props> = ({ recordId, tableName, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await getAuditLogsForRecord(tableName, recordId);
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [recordId, tableName]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Bitácora de Auditoría</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500 italic">Consultando base de datos...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay historial disponible.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    log.action === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                    log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {log.action === 'INSERT' ? 'Creación' : log.action === 'UPDATE' ? 'Modificación' : 'Eliminación'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(log.changed_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Usuario:</span> {log.changed_by || 'Admin (Sistema)'}
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] font-mono pt-2 bg-slate-950/30 p-2 rounded">
                  <div className="space-y-1">
                    <div className="text-slate-500 border-b border-slate-800 pb-1">Estado Anterior</div>
                    <pre className="text-slate-400">
                      {log.old_data ? JSON.stringify({status: log.old_data.status, hours: log.old_data.hours_worked}, null, 1) : '-'}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 border-b border-slate-800 pb-1">Nuevo Estado</div>
                    <pre className="text-blue-300 font-bold">
                      {log.new_data ? JSON.stringify({status: log.new_data.status, hours: log.new_data.hours_worked}, null, 1) : '-'}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <footer className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center uppercase tracking-widest">
          Registro Inmutable del Sistema
        </footer>
      </div>
    </div>
  );
};