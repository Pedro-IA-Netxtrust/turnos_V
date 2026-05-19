'use client';

import { useState } from 'react';
import { seedEmployees } from '@/services/seedService';
import { EmployeeInput } from '@/utils/validators';

interface StepEmployeesProps {
  wizardData: any;
  updateWizardData: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepEmployees({ wizardData, updateWizardData, onNext, onPrev }: StepEmployeesProps) {
  const [manualEmployees, setManualEmployees] = useState<EmployeeInput[]>(wizardData.employees || []);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addManualEmployee = () => {
    setManualEmployees([...manualEmployees, {
      rut: '',
      first_name: '',
      last_name: '',
      email: '',
      gender: 'M',
      role_title: '',
      contract_type: 'FAENA',
      area_id: '', // Debería obtenerse de áreas disponibles
      sub_area: '',
      fte_percentage: 100,
      is_group_61: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      is_active: true,
    }]);
  };

  const updateManualEmployee = (index: number, field: string, value: any) => {
    const updated = [...manualEmployees];
    updated[index] = { ...updated[index], [field]: value };
    setManualEmployees(updated);
  };

  const removeManualEmployee = (index: number) => {
    setManualEmployees(manualEmployees.filter((_, i) => i !== index));
  };

  const runDryRun = async () => {
    setLoading(true);
    const result = await seedEmployees(manualEmployees, true);
    setDryRunResult(result);
    setLoading(false);
  };

  const proceedToNext = () => {
    updateWizardData('employees', manualEmployees);
    onNext();
  };

  return (
    <div className="step-container">
      <h2>Configurar Empleados</h2>
      <p>Registra los empleados iniciales del sistema.</p>

      <section className="manual-input">
        <h3>Ingreso Manual</h3>
        {manualEmployees.map((employee, index) => (
          <div key={index} className="employee-form">
            <input
              type="text"
              placeholder="RUT (ej: 12345678-9)"
              value={employee.rut}
              onChange={(e) => updateManualEmployee(index, 'rut', e.target.value)}
            />
            <input
              type="text"
              placeholder="Nombre"
              value={employee.first_name}
              onChange={(e) => updateManualEmployee(index, 'first_name', e.target.value)}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={employee.last_name}
              onChange={(e) => updateManualEmployee(index, 'last_name', e.target.value)}
            />
            <select
              value={employee.gender}
              onChange={(e) => updateManualEmployee(index, 'gender', e.target.value)}
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <input
              type="text"
              placeholder="Cargo"
              value={employee.role_title}
              onChange={(e) => updateManualEmployee(index, 'role_title', e.target.value)}
            />
            <select
              value={employee.contract_type}
              onChange={(e) => updateManualEmployee(index, 'contract_type', e.target.value)}
            >
              <option value="FAENA">Faena</option>
              <option value="TELETRABAJO">Teletrabajo</option>
              <option value="MIXTO">Mixto</option>
            </select>
            <input
              type="text"
              placeholder="Area ID"
              value={employee.area_id}
              onChange={(e) => updateManualEmployee(index, 'area_id', e.target.value)}
            />
            <input
              type="number"
              placeholder="FTE %"
              value={employee.fte_percentage}
              onChange={(e) => updateManualEmployee(index, 'fte_percentage', parseInt(e.target.value))}
            />
            <input
              type="date"
              placeholder="Fecha inicio"
              value={employee.start_date}
              onChange={(e) => updateManualEmployee(index, 'start_date', e.target.value)}
            />
            <button type="button" onClick={() => removeManualEmployee(index)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addManualEmployee}>Agregar Empleado</button>
      </section>

      <section className="dry-run">
        <button type="button" onClick={runDryRun} disabled={loading || manualEmployees.length === 0}>
          Probar Inserción (Dry-Run)
        </button>
        {dryRunResult && <div className="dry-run-results">{/* Resultados */}</div>}
      </section>

      <div className="step-actions">
        <button type="button" onClick={onPrev}>Anterior</button>
        <button type="button" onClick={proceedToNext}>Siguiente: Revisión</button>
      </div>
    </div>
  );
}
