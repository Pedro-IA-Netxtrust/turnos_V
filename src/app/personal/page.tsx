"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { getActiveEmployees, type EmployeeRow } from '../../lib/crud/employees';
import { supabase } from '../../lib/supabase';

const PersonalPage = () => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [areas, setAreas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar empleados y áreas en paralelo para optimizar el tiempo de respuesta
        const [empData, { data: areaData }] = await Promise.all([
          getActiveEmployees(),
          supabase.from('areas').select('id, name')
        ]);

        setEmployees(empData || []);
        
        // Crear un mapa de búsqueda rápida para transformar area_id -> nombre de área
        if (areaData) {
          const areaMap = areaData.reduce((acc: Record<string,string>, area: any) => ({
            ...acc,
            [area.id]: area.name
          }), {});
          setAreas(areaMap);
        }
      } catch (error) {
        console.error('Error loading personal data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Gestión de Personal</h1>
            <p className="text-slate-400 text-lg">Directorio de trabajadores y configuración de perfiles FTE</p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Filtrar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-inner"
            />
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-employee'))} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
              + Nuevo Trabajador
            </button>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-800">
                <th className="py-4 px-6 font-bold">Código / RUT</th>
                <th className="py-4 px-6 font-bold">Nombre Completo</th>
                <th className="py-4 px-6 font-bold">Área Asignada</th>
                <th className="py-4 px-6 text-center font-bold">Dedicación (FTE%)</th>
                <th className="py-4 px-6 font-bold">Estado</th>
                <th className="py-4 px-6 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-500 italic">Cargando directorio de personal...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-500">No se encontraron trabajadores activos en este contrato.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs text-slate-300">{emp.employee_code}</td>
                    <td className="py-4 px-6 text-white font-medium">{emp.last_name}, {emp.first_name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300">
                        {areas[emp.area_id] || 'Sin Área'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold ${emp.fte_percentage < 100 ? 'text-amber-500' : 'text-blue-400'}`}>
                        {emp.fte_percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-xs text-green-500 font-bold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> Activo
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-500 hover:text-white transition-colors mr-4 opacity-0 group-hover:opacity-100 font-bold">Editar</button>
                      <button className="text-red-500/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 font-bold">Dar de baja</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default PersonalPage;
