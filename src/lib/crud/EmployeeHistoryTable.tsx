import React, { useEffect, useState } from 'react';
import { getPlanningDailyByDateRange, deletePlanningDaily, type PlanningDailyRow } from '../lib/crud/planning';
import { AuditLogViewer } from '../components/AuditLogViewer';

interface Props {
  employeeId: string;
  refreshKey: number;
}

export const EmployeeHistoryTable: React.FC<Props> = ({ employeeId, refreshKey }) => {
  const [history, setHistory] = useState<PlanningDailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuditRecordId, setSelectedAuditRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        // Cargamos los últimos 30 días por defecto
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        const data = await getPlanningDailyByDateRange(
          employeeId,
          start.toISOString().slice(0, 10),
          end.toISOString().slice(0, 10)
        );
        setHistory(data.reverse()); // Más reciente primero
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [employeeId, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    
    try {
      await deletePlanningDaily(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'P': 'bg-green-500/20 text-green-400',
      'T': 'bg-blue-500/20 text-blue-400',
      'V': 'bg-purple-500/20 text-purple-400',
      'L': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
  };

  if (loading) return <div className="text-slate-500 py-4">Cargando historial...</div>;

  return (
    <>
      {selectedAuditRecordId && (
        <AuditLogViewer 
          recordId={selectedAuditRecordId}
          tableName="planning_daily"
          onClose={() => setSelectedAuditRecordId(null)}
        />
      )}

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-sm">
            <th className="py-3 px-2">Fecha</th>
            <th className="py-3 px-2">Estado</th>
            <th className="py-3 px-2">Horas</th>
            <th className="py-3 px-2">Notas</th>
            <th className="py-3 px-2 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {history.length === 0 ? (
            <tr><td colSpan={5} className="py-8 text-center text-slate-600">No hay registros recientes</td></tr>
          ) : (
            history.map((record) => (
              <tr key={record.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-2 font-mono">{record.plan_date}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-3 px-2">{record.hours_worked}h</td>
                <td className="py-3 px-2 text-slate-500 max-w-[150px] truncate">{record.notes}</td>
                <td className="py-3 px-2 text-right flex justify-end space-x-2">
                  <button 
                    onClick={() => setSelectedAuditRecordId(record.id)}
                    className="text-blue-500 hover:text-blue-400 p-1 transition-transform active:scale-90"
                    title="Ver Auditoría"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-400 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </<>
  );
};