import ExcelJS from 'exceljs';

export type PlanningExportRow = {
  areaCode: string;
  areaName: string;
  employeeCode: string;
  employeeName: string;
  planDate: string;
  status: 'P' | 'T' | 'V' | 'L';
  hoursWorked: number;
  notes?: string | null;
};

const summaryColumns = [
  { header: 'Área', key: 'areaName', width: 24 },
  { header: 'Código Área', key: 'areaCode', width: 14 },
  { header: 'Horas Totales', key: 'totalHours', width: 16 },
  { header: 'Registros', key: 'recordCount', width: 12 },
  { header: 'Detalle', key: 'detailLink', width: 28 },
];

const detailColumns = [
  { header: 'Área', key: 'areaName', width: 24 },
  { header: 'Código Área', key: 'areaCode', width: 14 },
  { header: 'Empleado', key: 'employeeName', width: 28 },
  { header: 'Código Empleado', key: 'employeeCode', width: 18 },
  { header: 'Fecha', key: 'planDate', width: 14 },
  { header: 'Estado', key: 'status', width: 8 },
  { header: 'Horas', key: 'hoursWorked', width: 12 },
  { header: 'Notas', key: 'notes', width: 32 },
];

export async function buildPlanningWorkbook(rows: PlanningExportRow[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet('Resumen');
  const detailSheet = workbook.addWorksheet('Detalle');

  summarySheet.columns = summaryColumns;
  detailSheet.columns = detailColumns;

  const detailRowMap = new Map<string, number>();
  const areaTotals = new Map<string, { totalHours: number; count: number; areaName: string; areaCode: string }>();

  rows
    .slice()
    .sort((a, b) => a.areaName.localeCompare(b.areaName) || a.employeeName.localeCompare(b.employeeName) || a.planDate.localeCompare(b.planDate))
    .forEach((row) => {
      const existing = areaTotals.get(row.areaCode) ?? { totalHours: 0, count: 0, areaName: row.areaName, areaCode: row.areaCode };
      existing.totalHours += row.hoursWorked;
      existing.count += 1;
      areaTotals.set(row.areaCode, existing);

      const added = detailSheet.addRow({
        areaName: row.areaName,
        areaCode: row.areaCode,
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        planDate: row.planDate,
        status: row.status,
        hoursWorked: row.hoursWorked,
        notes: row.notes ?? '',
      });

      if (!detailRowMap.has(row.areaCode)) {
        detailRowMap.set(row.areaCode, added.number);
      }
    });

  detailSheet.eachRow((row, rowNumber) => {
    row.font = { name: 'Calibri', size: 11 };
    if (rowNumber === 1) {
      row.font = { bold: true, name: 'Calibri', size: 11 };
    }
  });

  Array.from(areaTotals.values()).forEach((summary) => {
    const detailRow = detailRowMap.get(summary.areaCode);
    summarySheet.addRow({
      areaName: summary.areaName,
      areaCode: summary.areaCode,
      totalHours: roundTwo(summary.totalHours),
      recordCount: summary.count,
      detailLink: detailRow
        ? { text: 'Ver detalle', hyperlink: `#Detalle!A${detailRow}` }
        : '',
    });
  });

  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.font = { bold: true, name: 'Calibri', size: 11 };
    }
  });

  summarySheet.getColumn('detailLink').numFmt = '@';
  return workbook;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
