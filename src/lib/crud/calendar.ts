import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CalendarDay {
  date: Date;
  dateString: string;
  label: string;
  isWeekend: boolean;
  monthLabel: string;
}

/**
 * Genera los días para el ciclo de 12 meses (Nov - Oct)
 * @param startYear Año de inicio del ciclo (Noviembre)
 */
export function generateYearlyRange(startYear: number): CalendarDay[] {
  const startDate = new Date(startYear, 10, 1); // 1 de Noviembre
  const endDate = new Date(startYear + 1, 9, 31); // 31 de Octubre del siguiente año

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(day => ({
    date: day,
    dateString: format(day, 'yyyy-MM-dd'),
    label: format(day, 'dd'),
    isWeekend: isWeekend(day),
    monthLabel: format(day, 'MMMM yyyy', { locale: es })
  }));
}

/**
 * Agrupa días por mes para el encabezado
 */
export function getMonthsFromDays(days: CalendarDay[]) {
  return days.reduce((acc, day) => {
    const lastMonth = acc[acc.length - 1];
    if (!lastMonth || lastMonth.label !== day.monthLabel) {
      acc.push({ label: day.monthLabel, dayCount: 1 });
    } else {
      lastMonth.dayCount++;
    }
    return acc;
  }, [] as { label: string; dayCount: number }[]);
}