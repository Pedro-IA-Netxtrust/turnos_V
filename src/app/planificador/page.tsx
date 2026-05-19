'use client';

import { useEffect, useMemo, useState } from 'react';
import { getActiveAreas } from '@/lib/crud/areas';
import { getEmployeesByArea, type EmployeeRow } from '@/lib/crud/employees';
import { getWeeklyPatternsByArea, type WeeklyPatternRow } from '@/lib/crud/weeklyPatterns';
import { getPlanningDailyByDateRange, bulkUpsertPlanningDaily, type PlanningDailyRow } from '@/lib/crud/planning';

const statuses = [
  { value: 'P' as const, label: 'Presente', color: '#6efc96' },
  { value: 'T' as const, label: 'Turno libre', color: '#4fc4ff' },
  { value: 'V' as const, label: 'Vacaciones', color: '#f2c94c' },
  { value: 'L' as const, label: 'Licencia', color: '#ff8b61' },
];

const getFiscalYearStart = (date: Date) => {
  const year = date.getMonth() >= 10 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 10, 1);
};

const getMonthMatrix = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const weeks: Array<Array<{ day: number | null; date: string }>> = [];
  let week: Array<{ day: number | null; date: string }> = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    week.push({ day: null, date: '' });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    week.push({ day, date: dateString });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ day: null, date: '' });
    }
    weeks.push(week);
  }

  return weeks;
};

const getStatusFromKey = (
  date: string,
  recordsMap: Map<string, PlanningDailyRow>,
  draftMap: Map<string, string>,
) => {
  if (draftMap.has(date)) {
    return draftMap.get(date) as 'P' | 'T' | 'V' | 'L';
  }
  return recordsMap.get(date)?.status ?? 'P';
};

export default function PlanificadorPage() {
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [patterns, setPatterns] = useState<WeeklyPatternRow[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedPatternId, setSelectedPatternId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'P' | 'T' | 'V' | 'L'>('P');
  const [records, setRecords] = useState<PlanningDailyRow[]>([]);
  const [draftUpdates, setDraftUpdates] = useState<Map<string, string>>(new Map());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fiscalStart = useMemo(() => getFiscalYearStart(new Date()), []);
  const fiscalEnd = useMemo(() => {
    const end = new Date(fiscalStart);
    end.setFullYear(fiscalStart.getFullYear() + 1);
    end.setMonth(9);
    end.setDate(31);
    return end;
  }, [fiscalStart]);

  const months = useMemo(() => {
    const monthList = [];
    const startYear = fiscalStart.getFullYear();
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(startYear, 10 + i, 1);
      monthList.push({ year: date.getFullYear(), month: date.getMonth() });
    }
    return monthList;
  }, [fiscalStart]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, PlanningDailyRow>();
    records.forEach((record) => map.set(record.plan_date, record));
    return map;
  }, [records]);

  useEffect(() => {
    const loadAreas = async () => {
      setIsLoading(true);
      try {
        const data = await getActiveAreas();
        setAreas(data);
        const firstArea = data && data.length > 0 ? data[0] : null;
        if (firstArea && !selectedAreaId) {
          setSelectedAreaId(firstArea.id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadAreas();
  }, []);

  useEffect(() => {
    if (!selectedAreaId) {
      return;
    }

    const loadEmployeesAndPatterns = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [employeeRows, patternRows] = await Promise.all([
          getEmployeesByArea(selectedAreaId),
          getWeeklyPatternsByArea(selectedAreaId),
        ]);
        setEmployees(employeeRows);
        setPatterns(patternRows);
        const firstEmployee = employeeRows.length > 0 ? employeeRows[0] : null;
        const firstPattern = patternRows.length > 0 ? patternRows[0] : null;
        if (firstEmployee && !selectedEmployeeId) {
          setSelectedEmployeeId(firstEmployee.id);
        }
        if (firstPattern && !selectedPatternId) {
          setSelectedPatternId(firstPattern.id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEmployeesAndPatterns();
  }, [selectedAreaId, selectedEmployeeId, selectedPatternId]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      return;
    }

    const loadRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rows = await getPlanningDailyByDateRange(
          selectedEmployeeId,
          fiscalStart.toISOString().slice(0, 10),
          fiscalEnd.toISOString().slice(0, 10),
        );
        setRecords(rows);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecords();
  }, [selectedEmployeeId, fiscalEnd, fiscalStart]);

  const handleCellUpdate = (date: string) => {
    setDraftUpdates((current) => {
      const next = new Map(current);
      next.set(date, selectedStatus);
      return next;
    });
  };

  const applyPattern = () => {
    const selected = patterns.find((pattern) => pattern.id === selectedPatternId);
    if (!selected) {
      setError('Selecciona un patrón para sincronizar.');
      return;
    }
    const newUpdates = new Map(draftUpdates);
    months.forEach(({ year, month }) => {
      const days = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= days; day += 1) {
        const cellDate = new Date(year, month, day);
        const dayOfWeek = cellDate.getDay();
        const activeHours =
          dayOfWeek === 0
            ? selected.hours_sun
            : dayOfWeek === 1
            ? selected.hours_mon
            : dayOfWeek === 2
            ? selected.hours_tue
            : dayOfWeek === 3
            ? selected.hours_wed
            : dayOfWeek === 4
            ? selected.hours_thu
            : dayOfWeek === 5
            ? selected.hours_fri
            : selected.hours_sat;
        newUpdates.set(cellDate.toISOString().slice(0, 10), activeHours > 0 ? 'P' : 'T');
      }
    });
    setDraftUpdates(newUpdates);
    setMessage('Patrón sincronizado en el calendario.');
    setError(null);
  };

  const saveChanges = async () => {
    if (draftUpdates.size === 0) {
      setMessage('No hay cambios pendientes.');
      return;
    }

    if (!selectedEmployeeId) {
      setError('Selecciona un empleado para guardar los cambios.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const recordsToSave = Array.from(draftUpdates.entries()).map(([date, statusValue]) => ({
        employee_id: selectedEmployeeId,
        plan_date: date,
        status: statusValue as 'P' | 'T' | 'V' | 'L',
        hours_worked: statusValue === 'P' ? 8 : 0,
        notes: null,
        created_by: null,
      }));
      await bulkUpsertPlanningDaily(recordsToSave);
      setDraftUpdates(new Map());
      setMessage('Cambios guardados correctamente.');
      const rows = await getPlanningDailyByDateRange(
        selectedEmployeeId,
        fiscalStart.toISOString().slice(0, 10),
        fiscalEnd.toISOString().slice(0, 10),
      );
      setRecords(rows);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const areaOptions = useMemo(
    () => areas.map((area) => ({ value: area.id, label: area.name })),
    [areas],
  );

  const employeeOptions = useMemo(
    () => employees.map((employee) => ({ value: employee.id, label: `${employee.employee_code} — ${employee.first_name} ${employee.last_name}` })),
    [employees],
  );

  const patternOptions = useMemo(
    () => patterns.map((pattern) => ({ value: pattern.id, label: pattern.name })),
    [patterns],
  );

  return (
    <main className="landing-shell planificador-page">
      <section className="section-header">
        <p className="section-label">Planificador Horizontal</p>
        <h3>Editor de estado por empleado con vista fiscal Nov–Oct.</h3>
        <p>
          Selecciona área, empleado y patrón semanal. Arrastra un estado en el calendario o haz clic sobre las celdas para actualizar.
        </p>
      </section>
      <div className="planificador-toolbar">
        <div className="form-group">
          <label htmlFor="area">Área</label>
          <select
            id="area"
            value={selectedAreaId}
            onChange={(event) => {
              setSelectedAreaId(event.target.value);
              setSelectedEmployeeId('');
              setSelectedPatternId('');
              setDraftUpdates(new Map());
            }}
          >
            {areaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="employee">Empleado</label>
          <select
            id="employee"
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
          >
            {employeeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="pattern">Patrón semanal</label>
          <select
            id="pattern"
            value={selectedPatternId}
            onChange={(event) => setSelectedPatternId(event.target.value)}
          >
            {patternOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="ghost-button" onClick={applyPattern}>
          Aplicar patrón
        </button>
      </div>

      <div className="status-palette">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`status-chip ${selectedStatus === item.value ? 'active' : ''}`}
            style={{ borderColor: item.color }}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', item.value);
            }}
            onClick={() => setSelectedStatus(item.value)}
          >
            <span className="status-dot" style={{ background: item.color }} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="calendar-shell">
        {months.map(({ year, month }) => {
          const weeks = getMonthMatrix(year, month);
          return (
            <section key={`${year}-${month}`} className="calendar-month">
              <header>
                <h4>{new Date(year, month, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
              </header>
              <div className="calendar-grid">
                <div className="calendar-weekday">D</div>
                <div className="calendar-weekday">L</div>
                <div className="calendar-weekday">M</div>
                <div className="calendar-weekday">M</div>
                <div className="calendar-weekday">J</div>
                <div className="calendar-weekday">V</div>
                <div className="calendar-weekday">S</div>
                {weeks.flatMap((week) =>
                  week.map((cell) => {
                    const statusValue = cell.date
                      ? getStatusFromKey(cell.date, recordsMap, draftUpdates)
                      : 'P';
                    const statusColor = statuses.find((item) => item.value === statusValue)?.color ?? '#ffffff';
                    return (
                      <button
                        key={`${year}-${month}-${cell.date || 'empty'}-${cell.day || 0}`}
                        type="button"
                        className={`calendar-cell ${cell.day ? '' : 'empty'}`}
                        draggable={Boolean(cell.day)}
                        onClick={() => {
                          if (!cell.day) return;
                          handleCellUpdate(cell.date);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const draggedStatus = event.dataTransfer.getData('text/plain') as 'P' | 'T' | 'V' | 'L';
                          if (!cell.day || !draggedStatus) return;
                          setDraftUpdates((current) => {
                            const next = new Map(current);
                            next.set(cell.date, draggedStatus);
                            return next;
                          });
                        }}
                        style={{
                          borderColor: cell.day ? 'rgba(255,255,255,0.1)' : 'transparent',
                          background: cell.day ? `rgba(${parseInt(statusColor.slice(1, 3), 16)}, ${parseInt(
                            statusColor.slice(3, 5),
                            16,
                          )}, ${parseInt(statusColor.slice(5, 7), 16)}, 0.17)` : 'transparent',
                        }}
                      >
                        <span>{cell.day ?? ''}</span>
                        {cell.day ? <span className="calendar-status" style={{ background: statusColor }} /> : null}
                      </button>
                    );
                  }),
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="planificador-actions">
        <button type="button" className="cta-button" onClick={saveChanges} disabled={isSaving}>
          {isSaving ? 'Guardando cambios...' : 'Guardar cambios'}
        </button>
        <span className="saved-count">{draftUpdates.size} cambios pendientes</span>
      </div>

      {message ? <div className="alert success">{message}</div> : null}
      {error ? <div className="alert danger">{error}</div> : null}
    </main>
  );
}
