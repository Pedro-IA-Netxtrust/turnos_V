import React, { useEffect, useState } from 'react';
import { getActiveEmployees, type EmployeeLookup } from '@/lib/crud/employees';

interface Props {
  onSelect: (employee: EmployeeLookup | null) => void;
  selectedId?: string | undefined;
}

export const EmployeeSelector: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getActiveEmployees()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, []);

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-400">Buscar Trabajador</label>
      <input
        type="text"
        placeholder="Nombre o RUT..."
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg scrollbar-thin scrollbar-thumb-slate-600">
        {loading ? (
          <div className="p-4 text-slate-500 text-center">Cargando personal...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-4 text-slate-500 text-center">No se encontraron resultados</div>
        ) : (
          filteredEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => onSelect(emp)}
              className={`w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0 flex justify-between items-center ${
                selectedId === emp.id ? 'bg-blue-900/30 text-blue-400' : 'text-slate-200'
              }`}
            >
              <span className="font-medium">
                {emp.last_name}, {emp.first_name}
              </span>
              <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
                {emp.employee_code}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};