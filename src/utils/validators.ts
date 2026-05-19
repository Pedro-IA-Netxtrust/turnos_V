import { z } from 'zod';

// Validación RUT chileno (módulo 11)
export function validateRUT(rut: string): boolean {
  const cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;

  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return calculatedDV === dv;
}

// Esquemas Zod con validaciones estrictas
export const areaSchema = z.object({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Código debe ser alfanumérico mayúscula'),
  name: z.string().min(1).max(100),
  level: z.number().int().min(1).max(3),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Validar jerarquía: si tiene parent_id, level debe ser > 1
  if (data.parent_id && data.level <= 1) return false;
  return true;
}, { message: 'Áreas con padre deben tener level > 1' });

export const weeklyPatternSchema = z.object({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9-]+$/, 'Código debe ser alfanumérico con guiones'),
  total_weekly_hours: z.number().int().min(0).max(168),
  hours_distribution: z.record(z.string(), z.number().int().min(0).max(24)).refine((dist) => {
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return days.every(day => day in dist);
  }, { message: 'Debe incluir distribución para L,M,X,J,V,S,D' }),
});

export const employeeSchema = z.object({
  rut: z.string().refine(validateRUT, { message: 'RUT inválido' }),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: z.string().email().optional(),
  gender: z.enum(['M', 'F']),
  role_title: z.string().min(1).max(100),
  contract_type: z.enum(['FAENA', 'TELETRABAJO', 'MIXTO']),
  area_id: z.string().uuid(),
  sub_area: z.string().max(100).optional(),
  fte_percentage: z.number().min(0).max(100),
  is_group_61: z.boolean().default(false),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Fecha inválida' }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Fecha inválida' }).nullable().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // start_date <= end_date si end_date existe
  if (data.end_date && new Date(data.start_date) > new Date(data.end_date)) return false;
  return true;
}, { message: 'Fecha de fin debe ser posterior a fecha de inicio' });

export const userRoleSchema = z.object({
  auth_user_id: z.string().uuid(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'RRHH', 'EMPLOYEE']),
  accessible_areas: z.array(z.string().uuid()),
});

// Tipos inferidos
export type AreaInput = z.infer<typeof areaSchema>;
export type WeeklyPatternInput = z.infer<typeof weeklyPatternSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type UserRoleInput = z.infer<typeof userRoleSchema>;

// Validadores para carga masiva (con índices de fila)

