import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

export type ExcelPlanningImportRow = {
  areaCode: string;
  employeeCode: string;
  planDate: string;
  status: 'P' | 'T' | 'V' | 'L';
  hoursWorked: number;
  notes?: string | null;
  createdBy: string;
};

const importRowSchema = z.object({
  areaCode: z.string().min(1),
  employeeCode: z.string().min(1),
  planDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'planDate must be a valid ISO date string',
  }),
  status: z.enum(['P', 'T', 'V', 'L']),
  hoursWorked: z.number().min(0).max(12),
  notes: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
});

export type DryRunResult = {
  rows: ExcelPlanningImportRow[];
  errors: string[];
};

export async function parsePlanningExcelDryRun(filePath: string): Promise<DryRunResult> {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Excel file not found: ${absolutePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(absolutePath);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Excel file does not contain any worksheet.');
  }

  const headerRow = sheet.getRow(1);
  const headers = headerRow.values.map((cell) => String(cell ?? '').trim());
  const rows: ExcelPlanningImportRow[] = [];
  const errors: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = row.values as Array<string | number | null | undefined>;
    const mapped = {
      areaCode: String(values[1] ?? '').trim(),
      employeeCode: String(values[2] ?? '').trim(),
      planDate: String(values[3] ?? '').trim(),
      status: String(values[4] ?? '').trim() as 'P' | 'T' | 'V' | 'L',
      hoursWorked: Number(values[5] ?? 0),
      notes: values[6] == null ? null : String(values[6]),
      createdBy: String(values[7] ?? '').trim(),
    };

    const parseResult = importRowSchema.safeParse(mapped);
    if (!parseResult.success) {
      const issueMessages = parseResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push(`Row ${rowNumber}: ${issueMessages.join(', ')}`);
      return;
    }

    rows.push(parseResult.data);
  });

  return { rows, errors };
}
