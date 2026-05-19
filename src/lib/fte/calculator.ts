/**
 * Lógica de cálculo FTE y Metas HH
 * Basado en la Fase 4 del Plan de Implementación
 */

export type WeeklyHoursPattern = {
  hours_sun: number;
  hours_mon: number;
  hours_tue: number;
  hours_wed: number;
  hours_thu: number;
  hours_fri: number;
  hours_sat: number;
};

export type FteTargetResult = {
  targetHours: number;
  deviationPct: number | null;
  alert: boolean;
};

export type AreaFteResult = {
  targetHours: number;
  actualHours: number;
  deviationPct: number | null;
  actualFte: number;
};

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getWeekdayCounts(year: number, month: number): [number, number, number, number, number, number, number] {
  const days = getDaysInMonth(year, month);
  const counts: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];

  for (let day = 1; day <= days; day += 1) {
    const weekday = new Date(year, month - 1, day).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    counts[weekday] = counts[weekday] + 1;
  }

  return counts;
}

/**
 * Calcula la meta mensual de horas para un individuo.
 * Multiplica la ocurrencia de cada día de la semana en el mes por las horas del patrón.
 * @param pattern Horas por día de la semana
 * @param ftePercentage Porcentaje de dedicación (1-100)
 * @param year Año (YYYY)
 * @param month Mes (1-12)
 */
export function calculateMonthlyTarget(
  pattern: WeeklyHoursPattern,
  ftePercentage: number,
  year: number,
  month: number,
): number {
  if (ftePercentage <= 0 || ftePercentage > 100) {
    throw new Error('ftePercentage must be between 0 and 100');
  }

  const counts = getWeekdayCounts(year, month);
  const weeklyTotal =
    pattern.hours_sun +
    pattern.hours_mon +
    pattern.hours_tue +
    pattern.hours_wed +
    pattern.hours_thu +
    pattern.hours_fri +
    pattern.hours_sat;

  const monthlyHours =
    counts[0] * pattern.hours_sun +
    counts[1] * pattern.hours_mon +
    counts[2] * pattern.hours_tue +
    counts[3] * pattern.hours_wed +
    counts[4] * pattern.hours_thu +
    counts[5] * pattern.hours_fri +
    counts[6] * pattern.hours_sat;

  return roundTwo((monthlyHours * ftePercentage) / 100);
}

/**
 * Calcula la meta total de un área sumando los FTE individuales.
 * Implementa la fórmula: Meta = Σ(horas_dia_calendario × FTE%)
 */
export function calculateAreaTarget(
  pattern: WeeklyHoursPattern,
  employees: { fte_percentage: number }[],
  year: number,
  month: number,
): number {
  // Calculamos la base de horas del mes para un FTE 100%
  const baseMonthlyHours = calculateMonthlyTarget(pattern, 100, year, month);
  
  // Sumamos la proporción correspondiente a cada empleado según su FTE
  const totalTarget = employees.reduce((sum, emp) => {
    return sum + (baseMonthlyHours * (emp.fte_percentage / 100));
  }, 0);

  return roundTwo(totalTarget);
}

/**
 * Calcula la desviación porcentual.
 * Valor negativo indica que se trabajó menos de la meta.
 */
export function calculateDeviationPercentage(
  actualHours: number,
  targetHours: number,
): number | null {
  if (targetHours === 0) {
    return null;
  }

  return roundTwo(((actualHours - targetHours) / targetHours) * 100);
}

export function computeFteTargetWithAlert(
  actualHours: number,
  pattern: WeeklyHoursPattern,
  ftePercentage: number,
  year: number,
  month: number,
): FteTargetResult {
  const targetHours = calculateMonthlyTarget(pattern, ftePercentage, year, month);
  const deviationPct = calculateDeviationPercentage(actualHours, targetHours);
  return {
    targetHours,
    deviationPct,
    alert: deviationPct !== null && deviationPct < -10,
  };
}

/**
 * Calcula el FTE Real (Utilización)
 * Representa cuántas personas a tiempo completo equivalen las horas trabajadas.
 */
export function calculateActualFte(
  actualHours: number,
  pattern: WeeklyHoursPattern,
  year: number,
  month: number,
): number {
  const baseHours = calculateMonthlyTarget(pattern, 100, year, month);
  return baseHours > 0 ? roundTwo(actualHours / baseHours) : 0;
}
