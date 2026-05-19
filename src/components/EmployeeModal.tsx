import React, { useState } from 'react';
import { createEmployee, updateEmployee, type EmployeeRow } from '../lib/crud/employees';

interface Props {
  employee?: EmployeeRow; // Si existe, es modo edición
  areas: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeModal: React.FC<Props> = ({ employee, areas, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || '',
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    area_id: employee?.area_id || areas[0]?.id || '',
    fte_percentage: employee?.fte_percentage ?? 100,
    position: employee?.position || '',
    contract_type: employee?.contract_type || 'FAENA',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    // Client-side validations
    if (!formData.employee_code.trim()) {
      setErrorMessage('Código de trabajador es obligatorio.');
      setLoading(false);
      return;
    }
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMessage('Nombre y apellido son obligatorios.');
      setLoading(false);
      return;
    }
    if (!formData.area_id) {
      setErrorMessage('Selecciona un área válida antes de continuar.');
      setLoading(false);
      return;
    }
    if (typeof formData.fte_percentage !== 'number' || formData.fte_percentage <= 0 || formData.fte_percentage > 100) {
      setErrorMessage('Dedicación (FTE%) debe estar entre 1 y 100.');
      setLoading(false);
      return;
    }
    try {
      if (employee) {
        await updateEmployee(employee.id, formData);
      } else {
        await createEmployee(formData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      setErrorMessage('Error al guardar: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h2 className="text-xl font-bold text-white">
            {employee ? 'Editar Trabajador' : 'Nuevo Trabajador'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código / RUT</label>
              <input
                required
                value={formData.employee_code}
                onChange={e => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label>
              <input
                required
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellidos</label>
              <input
                required
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área de Trabajo</label>
            <select
              value={formData.area_id}
              onChange={e => setFormData({ ...formData, area_id: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dedicación (FTE%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.fte_percentage}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  setFormData({ ...formData, fte_percentage: Number.isNaN(v) ? 0 : v });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Contrato</label>
              <select
                value={formData.contract_type}
                onChange={e => setFormData({ ...formData, contract_type: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FAENA">Faena</option>
                <option value="TELETRABAJO">Teletrabajo</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-3">
            {errorMessage && (
              <div className="text-sm text-red-400 bg-slate-800/60 p-2 rounded-md">{errorMessage}</div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-2 rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};