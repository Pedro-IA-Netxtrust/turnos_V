import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { generateYearlyRange, getMonthsFromDays } from '../../lib/utils/calendar';
import { getActiveEmployees } from '../../lib/crud/employees';
import { getPlanningDailyBulk, bulkUpsertPlanningDaily, deletePlanningDailyByDate } from '../../lib/crud/planning';
import { StatusCell } from './StatusCell';
import { MainLayout } from '../../components/MainLayout';

export const CalendarPlanner: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [planningData, setPlanningData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'P' | 'T' | 'V' | 'L' | 'ERASER'>('P');
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'P' | 'T' | 'V' | 'L' | 'DELETE'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filtrado eficiente de empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = selectedAreaId === 'all' || emp.area_id === selectedAreaId;
      return matchesSearch && matchesArea;
    });
  }, [employees, searchTerm, selectedAreaId]);

  // Umbral de validación: 40% de dotación mínima requerida si hay un área seleccionada
  const minRequiredPresence = useMemo(() => {
    return selectedAreaId === 'all' ? 0 : Math.ceil(filteredEmployees.length * 0.4);
  }, [selectedAreaId, filteredEmployees.length]);

  // Cálculo de totales diarios (P, T, V, L) por columna
  const dailyTotals = useMemo(() => {
    const totals: Record<string, { P: number; T: number; V: number; L: number }> = {};
    
    days.forEach(day => {
      totals[day.dateString] = { P: 0, T: 0, V: 0, L: 0 };
      filteredEmployees.forEach(emp => {
        const key = `${emp.id}:${day.dateString}`;
        const pending = pendingChanges[key];
        
        let status: string | undefined;
        if (pending) {
          if (pending !== 'DELETE') status = pending;
        } else {
          status = planningData[emp.id]?.[day.dateString];
        }

        if (status === 'P') totals[day.dateString].P++;
        else if (status === 'T') totals[day.dateString].T++;
        else if (status === 'V') totals[day.dateString].V++;
        else if (status === 'L') totals[day.dateString].L++;
      });
    });
    
    return totals;
  }, [days, filteredEmployees, planningData, pendingChanges]);

  // Detener el arrastre globalmente si se suelta el mouse fuera de una celda
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Generar rango de 12 meses (Nov 2025 - Oct 2026 por ejemplo)
  const days = useMemo(() => generateYearlyRange(2025), []);
  const months = useMemo(() => getMonthsFromDays(days), [days]);

  const startDate = days[0].dateString;
  const endDate = days[days.length - 1].dateString;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar Empleados y Áreas en paralelo
        const [empList, { data: areaList }] = await Promise.all([
          getActiveEmployees(),
          supabase.from('areas').select('id, name').eq('is_active', true).order('name')
        ]);
        
        setEmployees(empList);
        if (areaList) setAreas(areaList);
        
        // Carga masiva optimizada: Una sola consulta para todos
        const ids = empList.map(e => e.id);
        const records = await getPlanningDailyBulk(ids, startDate, endDate);

        // Transformar array plano a Mapa { empId: { date: status } }
        const mappedData: Record<string, Record<string, string>> = {};
        records.forEach(rec => {
          if (!mappedData[rec.employee_id]) mappedData[rec.employee_id] = {};
          mappedData[rec.employee_id][rec.plan_date] = rec.status;
        });

        setPlanningData(mappedData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    };
    loadInitialData();
  }, []);

  // Proceso de pintado de celda (Local solamente)
  const paintCell = useCallback((employeeId: string, date: string) => {
    const key = `${employeeId}:${date}`;
    
    if (selectedTool === 'ERASER') {
      if (!planningData[employeeId]?.[date] && !pendingChanges[key]) return;
      setPendingChanges(prev => ({ ...prev, [key]: 'DELETE' }));
      return;
    }

    const nextStatus = selectedTool as 'P' | 'T' | 'V' | 'L';
    if (planningData[employeeId]?.[date] === nextStatus || pendingChanges[key] === nextStatus) return;

    setPendingChanges(prev => ({ ...prev, [key]: nextStatus }));
  }, [selectedTool, planningData, pendingChanges]);

  const handleSaveChanges = async () => {
    const changeKeys = Object.keys(pendingChanges);
    if (changeKeys.length === 0) return;

    setIsSaving(true);
    try {
      const upserts = [];
      const deletes = [];

      for (const key of changeKeys) {
        const [empId, date] = key.split(':');
        const action = pendingChanges[key];

        if (action === 'DELETE') {
          deletes.push(deletePlanningDailyByDate(empId, date));
        } else {
          upserts.push({
            employee_id: empId,
            plan_date: date,
            status: action,
            hours_worked: 9,
            created_by: '00000000-0000-0000-0000-000000000000'
          });
        }
      }

      if (upserts.length > 0) await bulkUpsertPlanningDaily(upserts);
      if (deletes.length > 0) await Promise.all(deletes);

      // Refrescar datos locales y limpiar pendientes
      setPlanningData(prev => {
        const newData = { ...prev };
        changeKeys.forEach(key => {
          const [empId, date] = key.split(':');
          const action = pendingChanges[key];
          if (!newData[empId]) newData[empId] = {};
          if (action === 'DELETE') delete newData[empId][date];
          else newData[empId][date] = action;
        });
        return newData;
      });
      setPendingChanges({});
      alert(`Se guardaron ${changeKeys.length} cambios exitosamente.`);
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMouseDown = useCallback((employeeId: string, date: string) => {
    setIsDragging(true);
    paintCell(employeeId, date);
  }, [paintCell]);

  const handleMouseEnter = useCallback((employeeId: string, date: string) => {
    if (isDragging) paintCell(employeeId, date);
  }, [isDragging, paintCell]);

  if (loading) return <div className="text-white p-8">Inicializando motor de planificación...</div>;

  return (
    <MainLayout activePage="planificador">
      <div className="flex flex-col h-[calc(100vh-12rem)] bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Toolbar superior */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white">Planificador Anual</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Herramienta de Asistencia</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todas las Áreas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>

          <button
            onClick={handleSaveChanges}
            disabled={Object.keys(pendingChanges).length === 0 || isSaving}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all
              ${Object.keys(pendingChanges).length > 0 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Guardando...' : `Confirmar Guardar (${Object.keys(pendingChanges).length})`}
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 ml-2 uppercase">Herramienta:</span>
          <div className="flex gap-1">
            {(['P', 'T', 'V', 'L', 'ERASER'] as const).map(tool => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`
                  px-3 py-1 rounded text-xs font-bold transition-all
                  ${selectedTool === tool 
                    ? (tool === 'ERASER' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20')
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                `}
              >
                {tool === 'P' ? 'Presente' : 
                 tool === 'T' ? 'Turno' : 
                 tool === 'V' ? 'Vacaciones' : 
                 tool === 'L' ? 'Licencia' : 'Borrador'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenedor del Scroll */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="inline-block min-w-full">
          {/* Encabezado del Calendario */}
          <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-700">
            {/* Fila de Meses */}
            <div className="flex">
              <div className="sticky left-0 z-30 w-64 bg-slate-900 border-r border-slate-700 h-10 flex items-center px-3 shrink-0">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-[10px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              {months.map(month => (
                <div 
                  key={month.label} 
                  className="border-r border-slate-800 h-10 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-500 shrink-0"
                  style={{ width: `${month.dayCount * 2}rem` }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            {/* Fila de Días */}
            <div className="flex">
              <div className="sticky left-0 z-30 w-64 bg-slate-900 border-r border-slate-700 h-8 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.3)]"></div>
              {days.map(day => (
                <div 
                  key={day.dateString}
                  className={`h-8 w-8 min-w-[2rem] border-r border-slate-800 flex items-center justify-center text-[10px] shrink-0 ${day.isWeekend ? 'bg-slate-800/50 text-slate-500' : 'text-slate-300'}`}
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo del Grid */}
          <div className="z-10">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="flex hover:bg-slate-800/30 group">
                <div className="sticky left-0 z-10 w-64 bg-slate-900 border-r border-slate-700 h-8 flex items-center px-4 text-xs text-slate-300 font-medium shrink-0 group-hover:bg-slate-800 transition-colors">
                  <span className="truncate">{emp.last_name}, {emp.first_name}</span>
                </div>
                <div className="flex">
                  {days.map(day => (
                    <StatusCell 
                      key={`${emp.id}-${day.dateString}`}
                      isWeekend={day.isWeekend}
                      status={(pendingChanges[`${emp.id}:${day.dateString}`] === 'DELETE' 
                                ? undefined 
                                : pendingChanges[`${emp.id}:${day.dateString}`] || planningData[emp.id]?.[day.dateString]) as any}
                      onMouseDown={() => handleMouseDown(emp.id, day.dateString)}
                      onMouseEnter={() => handleMouseEnter(emp.id, day.dateString)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fila de Totales (Pie de tabla) */}
          <div className="sticky bottom-0 z-20 bg-slate-900 border-t border-slate-700 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
            <div className="flex">
              <div className="sticky left-0 z-30 w-64 bg-slate-900 border-r border-slate-700 h-16 flex items-center px-4 text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-tight">
                <div className="flex flex-col">
                  <span>Resumen Disponibilidad</span>
                  {minRequiredPresence > 0 && (
                    <span className="text-[8px] text-slate-600 font-normal mt-0.5 tracking-normal">Meta Min: {minRequiredPresence}P</span>
                  )}
                </div>
              </div>
              <div className="flex">
                {days.map(day => {
                  const isCritical = minRequiredPresence > 0 && dailyTotals[day.dateString].P < minRequiredPresence;
                  return (
                    <div 
                      key={`total-${day.dateString}`}
                      className={`h-16 w-8 min-w-[2rem] border-r border-slate-800 flex flex-col items-center justify-center text-[9px] shrink-0 transition-colors ${
                        isCritical ? 'bg-red-950/40 border-t-2 border-t-red-600' : 'bg-slate-900/90'
                      }`}
                    >
                      <span className={`font-bold ${isCritical ? 'text-red-500 animate-pulse' : 'text-green-500'}`} title="Presentes">{dailyTotals[day.dateString].P}</span>
                    <span className="text-blue-400 font-bold" title="Turno">{dailyTotals[day.dateString].T}</span>
                    <span className="text-purple-400 font-bold" title="Vacaciones">{dailyTotals[day.dateString].V}</span>
                    <span className="text-red-400 font-bold" title="Licencia">{dailyTotals[day.dateString].L}</span>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};