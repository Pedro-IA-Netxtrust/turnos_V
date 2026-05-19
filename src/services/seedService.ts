import { supabase } from '@/lib/supabase';
import {
  AreaInput,
  WeeklyPatternInput,
  EmployeeInput,
  UserRoleInput,
} from '@/utils/validators';

export interface SeedResult {
  success: boolean;
  inserted: number;
  errors: { row: number; message: string }[];
}

// Función auxiliar para logging de auditoría
async function logAudit(action: string, tableName: string, recordId: string, details?: any) {
  await supabase.from('audit_log').insert({
    action,
    table_name: tableName,
    record_id: recordId,
    details,
    created_by: 'seed-system', // Usuario ficticio para seed
  });
}

// Inserción de áreas con dry-run
export async function seedAreas(areas: AreaInput[], dryRun = false): Promise<SeedResult> {
  const errors: { row: number; message: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    try {
      if (!dryRun) {
        const { data, error } = await supabase
          .from('areas')
          .upsert(area, { onConflict: 'code', ignoreDuplicates: false })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          inserted++;
          await logAudit('INSERT', 'areas', data.id, area);
        }
      } else {
        // En dry-run, solo validar sin insertar
        inserted++;
      }
    } catch (error: any) {
      errors.push({ row: i + 1, message: error.message });
    }
  }

  return { success: errors.length === 0, inserted, errors };
}

// Inserción de patrones semanales
export async function seedWeeklyPatterns(patterns: WeeklyPatternInput[], dryRun = false): Promise<SeedResult> {
  const errors: { row: number; message: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    try {
      if (!dryRun) {
        const { data, error } = await supabase
          .from('weekly_patterns')
          .upsert(pattern, { onConflict: 'code', ignoreDuplicates: false })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          inserted++;
          await logAudit('INSERT', 'weekly_patterns', data.id, pattern);
        }
      } else {
        inserted++;
      }
    } catch (error: any) {
      errors.push({ row: i + 1, message: error.message });
    }
  }

  return { success: errors.length === 0, inserted, errors };
}

// Inserción de empleados
export async function seedEmployees(employees: EmployeeInput[], dryRun = false): Promise<SeedResult> {
  const errors: { row: number; message: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    try {
      if (!dryRun) {
        const { data, error } = await supabase
          .from('employees')
          .upsert(employee, { onConflict: 'rut', ignoreDuplicates: false })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          inserted++;
          await logAudit('INSERT', 'employees', data.id, employee);
        }
      } else {
        inserted++;
      }
    } catch (error: any) {
      errors.push({ row: i + 1, message: error.message });
    }
  }

  return { success: errors.length === 0, inserted, errors };
}

// Inserción de roles de usuario
export async function seedUserRoles(roles: UserRoleInput[], dryRun = false): Promise<SeedResult> {
  const errors: { row: number; message: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    try {
      if (!dryRun) {
        const { data, error } = await supabase
          .from('user_roles')
          .upsert(role, { onConflict: 'auth_user_id', ignoreDuplicates: false })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          inserted++;
          await logAudit('INSERT', 'user_roles', data.id, role);
        }
      } else {
        inserted++;
      }
    } catch (error: any) {
      errors.push({ row: i + 1, message: error.message });
    }
  }

  return { success: errors.length === 0, inserted, errors };
}

// Función para crear usuario admin inicial (integra con Supabase Auth)
export async function createInitialAdmin(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Usuario no creado');

    const userId = authData.user.id;

    // Crear rol admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        auth_user_id: userId,
        role: 'ADMIN',
        accessible_areas: [], // Admin tiene acceso a todas
      });

    if (roleError) throw roleError;

    await logAudit('CREATE_ADMIN', 'user_roles', userId, { email });

    return { success: true, userId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


