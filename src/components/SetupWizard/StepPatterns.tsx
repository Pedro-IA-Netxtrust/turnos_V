'use client';

import { useState } from 'react';
import { seedWeeklyPatterns } from '@/services/seedService';
import { WeeklyPatternInput } from '@/utils/validators';

interface StepPatternsProps {
  wizardData: any;
  updateWizardData: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepPatterns({ wizardData, updateWizardData, onNext }: StepPatternsProps) {
  const [manualPatterns, setManualPatterns] = useState<WeeklyPatternInput[]>(wizardData.patterns || []);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addManualPattern = () => {
    setManualPatterns([...manualPatterns, {
      code: '',
      total_weekly_hours: 45,
      hours_distribution: { L: 9, M: 9, X: 9, J: 9, V: 9, S: 0, D: 0 },
    }]);
  };

  const updateManualPattern = (index: number, field: string, value: any) => {
    const updated = [...manualPatterns];
    updated[index] = { ...updated[index], [field]: value };
    setManualPatterns(updated);
  };

  const removeManualPattern = (index: number) => {
    setManualPatterns(manualPatterns.filter((_, i) => i !== index));
  };

  const runDryRun = async () => {
    setLoading(true);
    const result = await seedWeeklyPatterns(manualPatterns, true);
    setDryRunResult(result);
    setLoading(false);
  };

  const proceedToNext = () => {
    updateWizardData('patterns', manualPatterns);
    onNext();
  };

  return (
    <div className="step-container">
      <h2>Configurar Patrones Semanales</h2>
      <p>Define los patrones de trabajo semanal que usarán los empleados.</p>

      {/* Manual Input */}
      <section className="manual-input">
        <h3>Ingreso Manual</h3>
        {manualPatterns.map((pattern, index) => (
          <div key={index} className="pattern-form">
            <input
              type="text"
              placeholder="Código (ej: S45)"
              value={pattern.code}
              onChange={(e) => updateManualPattern(index, 'code', e.target.value)}
            />
            <input
              type="number"
              placeholder="Horas semanales"
              value={pattern.total_weekly_hours}
              onChange={(e) => updateManualPattern(index, 'total_weekly_hours', parseInt(e.target.value))}
            />
            <div className="hours-distribution">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                <input
                  key={day}
                  type="number"
                  placeholder={day}
                  value={pattern.hours_distribution[day] || 0}
                  onChange={(e) => updateManualPattern(index, 'hours_distribution', {
                    ...pattern.hours_distribution,
                    [day]: parseInt(e.target.value) || 0
                  })}
                />
              ))}
            </div>
            <button type="button" onClick={() => removeManualPattern(index)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addManualPattern}>Agregar Patrón</button>
      </section>

      {/* Dry Run */}
      <section className="dry-run">
        <button type="button" onClick={runDryRun} disabled={loading || manualPatterns.length === 0}>
          {loading ? 'Ejecutando...' : 'Probar Inserción (Dry-Run)'}
        </button>
        {dryRunResult && (
          <div className="dry-run-results">
            <p>Simulación: {dryRunResult.inserted} patrones válidos</p>
            {dryRunResult.errors.length > 0 && <p>Errores: {dryRunResult.errors.length}</p>}
          </div>
        )}
      </section>

      <div className="step-actions">
        <button type="button" onClick={proceedToNext} disabled={manualPatterns.length === 0}>
          Siguiente: Áreas
        </button>
      </div>
    </div>
  );
}
