'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getActiveEmployees } from '../../lib/crud/employees';
import { getPlanningDailyByEmployee, upsertPlanningDaily } from '../../lib/crud/planning';
import type { EmployeeRow } from '../../lib/crud/employees';
import type { PlanningDailyRow } from '../../lib/crud/planning';

const statusOptions = [
  { value: 'P', label: 'Presente' },
  { value: 'T', label: 'Turno Libre' },
  { value: 'V', label: 'Vacaciones' },
  { value: 'L', label: 'Licencia' },
] as const;

const todayString = () => new Date().toISOString().slice(0, 10);

const isOlderThan72Hours = (dateValue: string) => {
  const target = new Date(dateValue).getTime();
  const diff = Date.now() - target;
  return diff > 72 * 60 * 60 * 1000;
};

export default function RegistroPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [planDate, setPlanDate] = useState(todayString());
  const [status, setStatus] = useState<'P' | 'T' | 'V' | 'L'>('P');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [notes, setNotes] = useState('');
  const [records, setRecords] = useState<PlanningDailyRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  const range = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }, []);

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!selectedEmployeeId) {
      errors.push('Selecciona un empleado.');
    }

    if (hoursWorked < 0 || hoursWorked > 12) {
      errors.push('Las horas deben estar entre 0 y 12.');
    }

    if (isOlderThan72Hours(planDate)) {
      errors.push('No se permite editar registros con más de 72 horas de antigüedad.');
    }

    const selectedDate = new Date(planDate);
    const maxFuture = new Date();
    maxFuture.setDate(maxFuture.getDate() + 3);
    if (selectedDate > maxFuture) {
      errors.push('No se puede planificar más de 3 días en el futuro.');
    }

    return errors;
  }, [selectedEmployeeId, hoursWorked, planDate]);

  const loadEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getActiveEmployees();
      setEmployees(data);
      const firstEmployee = data[0];
      if (firstEmployee && !selectedEmployeeId) {
        setSelectedEmployeeId(firstEmployee.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecords = async (employeeId: string) => {
    if (!employeeId) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getPlanningDailyByEmployee(employeeId, range.from, range.to);
      setRecords(rows);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      void loadRecords(selectedEmployeeId);
    }
  }, [selectedEmployeeId, range.from, range.to]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (validation.length > 0) {
      setError(validation.join(' '));
      return;
    }

    setIsSaving(true);
    try {
      await upsertPlanningDaily({
        employee_id: selectedEmployeeId,
        plan_date: planDate,
        status,
        hours_worked: hoursWorked,
        notes: notes.trim() || null,
        created_by: null,
      });
      setMessage('Registro guardado correctamente.');
      setNotes('');
      void loadRecords(selectedEmployeeId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowSelect = (record: PlanningDailyRow) => {
    if (isOlderThan72Hours(record.plan_date)) {
      setError('No se puede editar un registro con más de 72 horas de antigüedad.');
      return;
    }

    setSelectedEmployeeId(record.employee_id);
    setPlanDate(record.plan_date);
    setStatus(record.status);
    setHoursWorked(Number(record.hours_worked));
    setNotes(record.notes ?? '');
    setMessage('Modo edición activado para el registro seleccionado.');
  };

  return (
    <main className="landing-shell registro-page">
      <section className="section-header">
        <p className="section-label">Registro Diario</p>
        <h3>Ingreso y edición de asistencia con validación automática.</h3>
        <p>
          Registra estados P/T/V/L, valida horas, bloquea ediciones antiguas y mantiene trazabilidad.
        </p>
      </section>

      <div className="registro-grid">
        <div className="registro-panel">
          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="employee">Empleado</label>
              <select
                id="employee"
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_code} — {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="plan_date">Fecha</label>
              <input
                id="plan_date"
                type="date"
                value={planDate}
                onChange={(event) => setPlanDate(event.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'P' | 'T' | 'V' | 'L')}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hours_worked">Horas</label>
                <input
                  id="hours_worked"
                  type="number"
                  min={0}
                  max={12}
                  value={hoursWorked}
                  onChange={(event) => setHoursWorked(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                value={notes}
                rows={4}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones opcionales"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="cta-button" disabled={isSaving || validation.length > 0}>
                {isSaving ? 'Guardando...' : 'Guardar registro'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setPlanDate(todayString());
                  setStatus('P');
                  setHoursWorked(8);
                  setNotes('');
                  setMessage(null);
                  setError(null);
                }}
              >
                Limpiar
              </button>
            </div>

            {message ? <div className="alert success">{message}</div> : null}
            {error ? <div className="alert danger">{error}</div> : null}
          </form>
        </div>

        <div className="registro-panel registro-table-panel">
          <div className="table-header">
            <h4>Registros recientes</h4>
            <span>{records.length} registros</span>
          </div>
          <div className="record-list">
            {isLoading ? (
              <p>Cargando registros...</p>
            ) : records.length === 0 ? (
              <p>No hay registros dentro del rango seleccionado.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Horas</th>
                    <th>Notas</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.plan_date}</td>
                      <td>{record.status}</td>
                      <td>{record.hours_worked}</td>
                      <td>{record.notes ?? '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => handleRowSelect(record)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
