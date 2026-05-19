'use client';

import { useState } from 'react';
import { seedAreas } from '@/services/seedService';
import { AreaInput } from '@/utils/validators';

interface StepAreasProps {
  wizardData: any;
  updateWizardData: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepAreas({ wizardData, updateWizardData, onNext, onPrev }: StepAreasProps) {
  const [manualAreas, setManualAreas] = useState<AreaInput[]>(wizardData.areas || []);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addManualArea = () => {
    setManualAreas([...manualAreas, { code: '', name: '', level: 1, parent_id: null, is_active: true }]);
  };

  const updateManualArea = (index: number, field: string, value: any) => {
    const updated = [...manualAreas];
    updated[index] = { ...updated[index], [field]: value };
    setManualAreas(updated);
  };

  const removeManualArea = (index: number) => {
    setManualAreas(manualAreas.filter((_, i) => i !== index));
  };

  const runDryRun = async () => {
    setLoading(true);
    const result = await seedAreas(manualAreas, true);
    setDryRunResult(result);
    setLoading(false);
  };

  const proceedToNext = () => {
    updateWizardData('areas', manualAreas);
    onNext();
  };

  return (
    <div className="step-container">
      <h2>Configurar Áreas</h2>
      <p>Define la estructura jerárquica de áreas de la organización.</p>

      <section className="manual-input">
        <h3>Ingreso Manual</h3>
        {manualAreas.map((area, index) => (
          <div key={index} className="area-form">
            <input
              type="text"
              placeholder="Código (ej: GCON)"
              value={area.code}
              onChange={(e) => updateManualArea(index, 'code', e.target.value)}
            />
            <input
              type="text"
              placeholder="Nombre"
              value={area.name}
              onChange={(e) => updateManualArea(index, 'name', e.target.value)}
            />
            <select
              value={area.level}
              onChange={(e) => updateManualArea(index, 'level', parseInt(e.target.value))}
            >
              <option value={1}>Contrato</option>
              <option value={2}>Gerencia</option>
              <option value={3}>Subárea</option>
            </select>
            <input
              type="text"
              placeholder="Parent ID (UUID)"
              value={area.parent_id || ''}
              onChange={(e) => updateManualArea(index, 'parent_id', e.target.value || null)}
            />
            <button type="button" onClick={() => removeManualArea(index)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addManualArea}>Agregar Área</button>
      </section>

      <section className="dry-run">
        <button type="button" onClick={runDryRun} disabled={loading || manualAreas.length === 0}>
          Probar Inserción (Dry-Run)
        </button>
        {dryRunResult && <div className="dry-run-results">{/* Resultados */}</div>}
      </section>

      <div className="step-actions">
        <button type="button" onClick={onPrev}>Anterior</button>
        <button type="button" onClick={proceedToNext}>Siguiente: Roles</button>
      </div>
    </div>
  );
}
