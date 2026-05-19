'use client';

import { useEffect, useState } from 'react';
import { getActiveAreas, createArea, updateArea, deleteArea, type AreaRow } from '@/lib/crud/areas';
import { getActiveEmployees, createEmployee, updateEmployee, deleteEmployee, type EmployeeRow } from '@/lib/crud/employees';
import { getWeeklyPatternsByArea, createWeeklyPattern, updateWeeklyPattern, deleteWeeklyPattern, type WeeklyPatternRow } from '@/lib/crud/weeklyPatterns';

export default function ConfiguracionPage() {
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [patterns, setPatterns] = useState<WeeklyPatternRow[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [areaForm, setAreaForm] = useState({ code: '', name: '', description: '' });
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    area_id: '',
    position: '',
    fte_percentage: 100,
    gender: '' as '' | 'M' | 'F' | 'O',
    contract_type: 'FAENA' as 'FAENA' | 'TELETRABAJO' | 'MIXTO',
    email: '',
    phone: '',
    hire_date: '',
  });
  const [patternForm, setPatternForm] = useState({
    name: '',
    area_id: '',
    hours_mon: 8,
    hours_tue: 8,
    hours_wed: 8,
    hours_thu: 8,
    hours_fri: 8,
    hours_sat: 0,
    hours_sun: 0,
    is_default: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      loadEmployeesAndPatterns(selectedAreaId);
      setEmployeeForm(prev => ({ ...prev, area_id: selectedAreaId }));
      setPatternForm(prev => ({ ...prev, area_id: selectedAreaId }));
    }
  }, [selectedAreaId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const areasData = await getActiveAreas();
      setAreas(areasData);
      const firstArea = areasData.length > 0 ? areasData[0] : null;
      if (firstArea) {
        setSelectedAreaId(firstArea.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeesAndPatterns = async (areaId: string) => {
    try {
      const [emps, pats] = await Promise.all([
        getActiveEmployees(),
        getWeeklyPatternsByArea(areaId),
      ]);
      setEmployees(emps.filter(e => e.area_id === areaId));
      setPatterns(pats);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreateArea = async () => {
    try {
      await createArea(areaForm);
      setMessage('Área creada correctamente.');
      setAreaForm({ code: '', name: '', description: '' });
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      await createEmployee(employeeForm);
      setMessage('Empleado creado correctamente.');
      setEmployeeForm({
        employee_code: '',
        first_name: '',
        last_name: '',
        area_id: selectedAreaId,
        position: '',
        fte_percentage: 100,
        gender: '',
        contract_type: 'FAENA',
        email: '',
        phone: '',
        hire_date: '',
      });
      loadEmployeesAndPatterns(selectedAreaId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreatePattern = async () => {
    try {
      await createWeeklyPattern(patternForm);
      setMessage('Patrón semanal creado correctamente.');
      setPatternForm({
        name: '',
        area_id: selectedAreaId,
        hours_mon: 8,
        hours_tue: 8,
        hours_wed: 8,
        hours_thu: 8,
        hours_fri: 8,
        hours_sat: 0,
        hours_sun: 0,
        is_default: false,
      });
      loadEmployeesAndPatterns(selectedAreaId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!confirm('¿Eliminar área?')) return;
    try {
      await deleteArea(id);
      setMessage('Área eliminada.');
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('¿Eliminar empleado?')) return;
    try {
      await deleteEmployee(id);
      setMessage('Empleado eliminado.');
      loadEmployeesAndPatterns(selectedAreaId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeletePattern = async (id: string) => {
    if (!confirm('¿Eliminar patrón?')) return;
    try {
      await deleteWeeklyPattern(id);
      setMessage('Patrón eliminado.');
      loadEmployeesAndPatterns(selectedAreaId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="landing-shell configuracion-page">
      <section className="section-header">
        <p className="section-label">Configuración Inicial</p>
        <h3>Administrar áreas, empleados y patrones semanales</h3>
        <p>
          Configura las entidades base del sistema. Selecciona un área para ver empleados y patrones asociados.
        </p>
      </section>

      <div className="configuracion-layout">
        {/* Áreas */}
        <section className="config-section">
          <h4>Áreas</h4>
          <div className="form-group">
            <input
              type="text"
              placeholder="Código"
              value={areaForm.code}
              onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nombre"
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
            />
            <textarea
              placeholder="Descripción"
              value={areaForm.description}
              onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
            />
            <button type="button" onClick={handleCreateArea}>Crear Área</button>
          </div>
          <ul className="entity-list">
            {areas.map((area) => (
              <li key={area.id}>
                <span>{area.code} - {area.name}</span>
                <button type="button" onClick={() => handleDeleteArea(area.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Empleados */}
        <section className="config-section">
          <h4>Empleados</h4>
          <div className="form-group">
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Código empleado"
              value={employeeForm.employee_code}
              onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nombre"
              value={employeeForm.first_name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={employeeForm.last_name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
            />
            <input
              type="number"
              placeholder="FTE %"
              value={employeeForm.fte_percentage}
              onChange={(e) => setEmployeeForm({ ...employeeForm, fte_percentage: parseInt(e.target.value) })}
            />
            <select
              value={employeeForm.contract_type}
              onChange={(e) => setEmployeeForm({ ...employeeForm, contract_type: e.target.value as any })}
            >
              <option value="FAENA">Faena</option>
              <option value="TELETRABAJO">Teletrabajo</option>
              <option value="MIXTO">Mixto</option>
            </select>
            <button type="button" onClick={handleCreateEmployee}>Crear Empleado</button>
          </div>
          <ul className="entity-list">
            {employees.map((emp) => (
              <li key={emp.id}>
                <span>{emp.employee_code} - {emp.first_name} {emp.last_name}</span>
                <button type="button" onClick={() => handleDeleteEmployee(emp.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Patrones Semanales */}
        <section className="config-section">
          <h4>Patrones Semanales</h4>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nombre patrón"
              value={patternForm.name}
              onChange={(e) => setPatternForm({ ...patternForm, name: e.target.value })}
            />
            <div className="hours-grid">
              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                <input
                  key={day}
                  type="number"
                  placeholder={day.toUpperCase()}
                  value={patternForm[`hours_${day}` as keyof typeof patternForm] as number}
                  onChange={(e) => setPatternForm({ ...patternForm, [`hours_${day}`]: parseInt(e.target.value) || 0 })}
                />
              ))}
            </div>
            <label>
              <input
                type="checkbox"
                checked={patternForm.is_default}
                onChange={(e) => setPatternForm({ ...patternForm, is_default: e.target.checked })}
              />
              Patrón por defecto
            </label>
            <button type="button" onClick={handleCreatePattern}>Crear Patrón</button>
          </div>
          <ul className="entity-list">
            {patterns.map((pat) => (
              <li key={pat.id}>
                <span>{pat.name} - {pat.hours_mon}-{pat.hours_tue}-{pat.hours_wed}-{pat.hours_thu}-{pat.hours_fri}-{pat.hours_sat}-{pat.hours_sun}</span>
                <button type="button" onClick={() => handleDeletePattern(pat.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert danger">{error}</div>}
    </main>
  );
}
