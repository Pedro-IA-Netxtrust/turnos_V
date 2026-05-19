import React, { useEffect, useState } from 'react';
import { getEmployeesByArea } from '../../lib/crud/employees';
import { getDefaultWeeklyPattern } from '../../lib/crud/weeklyPatterns';
import { getAreaActualHours } from '../../lib/crud/planning';
import { 
  calculateAreaTarget, 
  calculateDeviationPercentage, 
  calculateActualFte 
} from '../../lib/fte/calculator';

interface Props {
  areaId: string;
  areaName: string;
  year: number;
  month: number;
}

export const AreaConsolidationCard: React.FC<Props> = ({ areaId, areaName, year, month }) => {
  const [data, setData] = useState<{
    targetHours: number;
    actualHours: number;
    deviation: number | null;
    actualFte: number;
    loading: boolean;
  }>({
    targetHours: 0,
    actualHours: 0,
    deviation: null,
    actualFte: 0,
    loading: true
  });

  useEffect(() => {
    const loadConsolidation = async () => {
      try {
        // 1. Obtener datos base en paralelo
        const [employees, pattern, actualHours] = await Promise.all([
          getEmployeesByArea(areaId),
          getDefaultWeeklyPattern(areaId),
          getAreaActualHours(areaId, year, month)
        ]);

        if (!pattern) throw new Error("No default pattern found");

        // 2. Ejecutar motor de cálculo (Fase 4)
        const targetHours = calculateAreaTarget(pattern, employees, year, month);
        const deviation = calculateDeviationPercentage(actualHours, targetHours);
        const actualFte = calculateActualFte(actualHours, pattern, year, month);

        setData({
          targetHours,
          actualHours,
          deviation,
          actualFte,
          loading: false
        });
      } catch (error) {
        console.error("Error calculating consolidation:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    loadConsolidation();
  }, [areaId, year, month]);

  if (data.loading) return (
    <div className="bg-slate-900 animate-pulse h-32 rounded-xl border border-slate-800"></div>
  );

  const isAlert = data.deviation !== null && data.deviation < -10;

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      isAlert 
        ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-900/10' 
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      <header className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{areaName}</h3>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Consolidado Mensual</p>
        </div>
        {isAlert && (
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase font-bold">Horas Hombre (HH)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{data.actualHours}</span>
            <span className="text-slate-600 text-xs">/ {data.targetHours}</span>
          </div>
        </div>

        <div className="space-y-1 text-right">
          <p className="text-slate-500 text-[10px] uppercase font-bold">Desviación</p>
          <p className={`text-xl font-mono font-bold ${
            data.deviation && data.deviation >= 0 ? 'text-green-500' : isAlert ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {data.deviation ? `${data.deviation > 0 ? '+' : ''}${data.deviation}%` : '0%'}
          </p>
        </div>
      </div>

      <footer className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-slate-400 text-xs">Utilización FTE Real:</span>
        <span className="text-blue-400 font-mono font-bold">{data.actualFte.toFixed(2)}</span>
      </footer>
    </div>
  );
};