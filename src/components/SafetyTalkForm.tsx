import React, { useState } from 'react';
import { EmployeeSelector } from '../../docs/EmployeeSelector';
import { registerSafetyTalk } from '../lib/crud/safety';

interface Props {
  onSuccess: () => void;
  employeeId?: string | null;
  employeeName?: string;
}

export const SafetyTalkForm: React.FC<Props> = ({ onSuccess, employeeId: initialEmployeeId, employeeName }) => {
  const [employeeId, setEmployeeId] = useState<string | null>(initialEmployeeId || null);
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !topic) return alert("Complete todos los campos");

    setLoading(true);
    try {
      await registerSafetyTalk({
        employee_id: employeeId,
        talk_date: date,
        topic: topic
      });
      setTopic('');
      alert("Charla registrada con éxito");
      onSuccess();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-yellow-500">🛡️</span> Registro Charla de Seguridad
        {employeeName && <span className="text-slate-400 font-normal text-sm"> - {employeeName}</span>}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialEmployeeId && (
          <EmployeeSelector 
            onSelect={(emp) => setEmployeeId(emp?.id || null)} 
            selectedId={employeeId || undefined} 
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tema / Tópico</label>
            <select 
              value={topic} 
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione...</option>
              <option value="Uso de EPP">Uso de EPP</option>
              <option value="Riesgos en Altura">Riesgos en Altura</option>
              <option value="Bloqueo de Energías">Bloqueo de Energías</option>
              <option value="Primeros Auxilios">Primeros Auxilios</option>
              <option value="Manejo a la Defensiva">Manejo a la Defensiva</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          {loading ? 'PROCESANDO...' : 'REGISTRAR ASISTENCIA A CHARLA'}
        </button>
      </form>
    </div>
  );
};