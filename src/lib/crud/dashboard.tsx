import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AreaConsolidationCard } from '../lib/crud/AreaConsolidationCard';
import { getGlobalActualHours } from '../lib/crud/planning';
import { getActiveEmployees } from '../lib/crud/employees';
import { calculateMonthlyTarget, calculateDeviationPercentage } from '../lib/fte/calculator';
import { getMonthlySafetyCount } from '../lib/crud/safety';

const DashboardPage = () => {
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalHH, setGlobalHH] = useState({ actual: 0, target: 0, deviation: 0 as number | null });
  const [safetyCount, setSafetyCount] = useState(0);
  
  // Estado global para el periodo de consulta del dashboard
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Obtener Áreas, Empleados, Patrones y Horas Reales en paralelo
        const [
          { data: areaList, error: areaErr },
          employees,
          actualHH,
          { data: patterns, error: patErr },
          safetyTotal
        ] = await Promise.all([
          supabase.from('areas').select('id, name').eq('is_active', true).order('name'),
          getActiveEmployees(),
          getGlobalActualHours(year, month),
          supabase.from('weekly_patterns').select('*').eq('is_default', true),
          getMonthlySafetyCount(year, month)
        ]);

        if (areaErr) throw areaErr;
        if (patErr) throw patErr;

        // 2. Calcular Meta Global (Sumatoria de metas individuales basadas en sus patrones de área)
        const patternMap = (patterns || []).reduce((acc: any, p) => ({ ...acc, [p.area_id]: p }), {});
        
        const targetHH = employees.reduce((total, emp) => {
          const pattern = patternMap[emp.area_id];
          if (!pattern) return total;
          return total + calculateMonthlyTarget(pattern, emp.fte_percentage, year, month);
        }, 0);

        setAreas(areaList || []);
        setGlobalHH({
          actual: actualHH,
          target: Math.round(targetHH),
          deviation: calculateDeviationPercentage(actualHH, targetHH)
        });
        setSafetyCount(safetyTotal);
      } catch (err) {
        console.error("Error fetching areas for dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [year, month]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Encabezado con Filtros Globales */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Panel de Consolidación</h1>
            <p className="text-slate-400 text-lg">Resumen de cumplimiento de Horas Hombre y utilización FTE</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider ml-1">Periodo de Análisis</label>
              <div className="flex gap-2">
                <select 
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  {months.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
                
                <select 
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Resumen General Global */}
        {!loading && areas.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-b-4 border-b-blue-600">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total General Contrato</h2>
                <p className="text-xs text-slate-600">Consolidado de todas las áreas activas</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-8 text-center md:text-left">
              <div className="border-r border-slate-800 pr-8">
                <p className="text-[10px] text-yellow-500 font-bold uppercase mb-1">Charlas Seg.</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-black text-white font-mono">{safetyCount}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">Asist.</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">HH Reales / Meta</p>
                <p className="text-4xl font-black text-white font-mono">{globalHH.actual.toLocaleString()}<span className="text-slate-700 text-xl ml-2">/ {globalHH.target.toLocaleString()}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Cump. HH</p>
                <p className={`text-4xl font-black font-mono ${globalHH.deviation !== null && globalHH.deviation < -10 ? 'text-red-500' : 'text-green-500'}`}>
                  {globalHH.deviation !== null ? `${globalHH.deviation > 0 ? '+' : ''}${globalHH.deviation}%` : '0%'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Rejilla de Tarjetas por Área */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-900 animate-pulse h-48 rounded-2xl border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.map(area => (
              <AreaConsolidationCard 
                key={`${area.id}-${year}-${month}`}
                areaId={area.id}
                areaName={area.name}
                year={year}
                month={month}
              />
            ))}
            {areas.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                No hay áreas activas registradas. Configure el sistema para comenzar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;