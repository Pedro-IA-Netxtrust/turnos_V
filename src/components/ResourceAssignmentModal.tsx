import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeSelector } from '../../docs/EmployeeSelector';
import { assignResource, getResourceAssignments } from '../lib/crud/resources';
import { format, parseISO, areIntervalsOverlapping } from 'date-fns';

interface Props {
  resourceId: string;
  resourceCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResourceAssignmentModal: React.FC<Props> = ({ resourceId, resourceCode, onClose, onSuccess }) => {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [existingAssignments, setExistingAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cargar asignaciones actuales para validación local en tiempo real
  useEffect(() => {
    getResourceAssignments(resourceId).then(setExistingAssignments).catch(console.error);
  }, [resourceId]);

  // Lógica de validación reactiva
  const validation = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (endDate < startDate) return "La fecha de término debe ser posterior o igual al inicio.";
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const overlap = existingAssignments.find(asgn => {
      const exStart = parseISO(asgn.start_date);
      const exEnd = parseISO(asgn.end_date);
      return areIntervalsOverlapping(
        { start, end },
        { start: exStart, end: exEnd },
        { inclusive: true }
      );
    });

    if (overlap) {
      return `Conflicto: El vehículo ya está asignado a ${overlap.employees?.last_name || 'otro trabajador'} entre ${overlap.start_date} y ${overlap.end_date}.`;
    }

    return null;
  }, [startDate, endDate, existingAssignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert("Debe seleccionar un trabajador");
    if (validation) return;

    setLoading(true);
    setLocalError(null);
    try {
      await assignResource({
        resource_id: resourceId,
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
        created_by: '00000000-0000-0000-0000-000000000000' // ID Admin temporal
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <header className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Asignar Recurso</h2>
            <p className="text-xs text-blue-400 font-mono">{resourceCode}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <EmployeeSelector onSelect={(emp) => setEmployeeId(emp?.id || null)} selectedId={employeeId || undefined} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Término</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Viaje a faena sector norte..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm" />
          </div>

          {(validation || localError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{validation || localError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={loading || !!validation} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20">
              {loading ? 'Guardando...' : 'Confirmar Asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};