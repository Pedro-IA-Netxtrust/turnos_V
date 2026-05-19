import React, { useState } from 'react';
import { saveDailyRegister } from '@/lib/crud/planning';

interface Props {
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
}

export const DailyRegisterForm: React.FC<Props> = ({ employeeId, employeeName, onSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'P' | 'T' | 'V' | 'L'>('P');
  const [hours, setHours] = useState<number>(9);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const selectedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - selectedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (hours < 0 || hours > 12) return "Las horas deben estar entre 0 y 12";
    if (selectedDate > new Date(now.setDate(now.getDate() + 3))) {
      return "No puedes planificar más de 3 días en el futuro";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveDailyRegister({
        employee_id: employeeId,
        plan_date: date,
        status,
        hours_worked: hours,
        notes: notes || null,
        created_by: '00000000-0000-0000-0000-000000000000' // ID Admin temporal para Fase 2
      });
      
      setNotes('');
      if (onSuccess) onSuccess();
      alert('Registro guardado con éxito');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white max-w-md">
      <h2 className="text-xl font-bold mb-4">Registrar Jornada: {employeeName}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400">Fecha</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400">Estado</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 outline-none"
            >
              <option value="P">Presente (P)</option>
              <option value="T">Teletrabajo (T)</option>
              <option value="V">Vacaciones (V)</option>
              <option value="L">Licencia (L)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400">Horas (0-12)</label>
            <input 
              type="number" 
              step="0.5"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400">Notas (Opcional)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 h-20 outline-none"
            placeholder="Observaciones de la jornada..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar Registro'}
        </button>
      </form>
    </div>
  );
};