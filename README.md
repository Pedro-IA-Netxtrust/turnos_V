# Sistema Asistencia Faena - Documentación Técnica

## Descripción General
Sistema de gestión de asistencia y planificación de faenas que reemplaza planillas Excel. Construcción modular con:
- **Backend:** Supabase (PostgreSQL, Auth RLS, Realtime)
- **Frontend:** Next.js 14 con TypeScript estricto
- **Validación:** Zod schemas
- **Testing:** Jest
- **Export:** ExcelJS para reportes

## Estructura del Proyecto

```
valentina/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql      # Tablas, tipos enum, triggers, índices
│       └── 002_rls_policies.sql        # Políticas RLS y funciones de seguridad
├── src/
│   └── lib/
│       ├── supabase.ts                 # Cliente Supabase tipado
│       ├── types/
│       │   └── database.types.ts       # Tipos generados de la DB
│       ├── crud/
│       │   ├── employees.ts            # CRUD empleados
│       │   └── planning.ts             # CRUD planificación + bulk insert
│       ├── fte/
│       │   └── calculator.ts           # Motor de cálculo FTE
│       ├── export/
│       │   └── excel.ts                # Exportación Excel con drill-down
│       └── migration/
│           └── excel-import.ts         # Importación Excel con dry-run
├── tests/
│   ├── employees.test.ts               # Tests CRUD empleados
│   ├── planning.test.ts                # Tests validación planificación
│   └── fte.test.ts                     # Tests motor FTE
├── docs/
│   └── rls-and-approval-flow.md        # Documentación RLS y seguridad
├── .env.local                          # Variables de entorno (NO versionar)
├── .env.local.example                  # Template .env
├── jest.config.ts                      # Configuración Jest
├── tsconfig.json                       # Configuración TypeScript estricta
└── package.json                        # Dependencias
```

## Guía de Instalación

### 1. Clonar y configurar

```bash
# Clonar o descargar en c:\Users\Peyo\Documents\Valentina
cd "C:\Users\Peyo\Documents\Valentina"

# Instalar dependencias
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar template
cp .env.local.example .env.local

# Editar .env.local con credenciales Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://wjzdqcttuiixrybxoaqi.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
# SUPABASE_SERVICE_ROLE_KEY=... (para migraciones)
```

### 3. Desplegar schema en Supabase

```bash
# Opción A: Usando Supabase CLI (requiere Docker)
npm install -g supabase
supabase link --project-ref wjzdqcttuiixrybxoaqi
supabase db push

# Opción B: Manual en Supabase Dashboard
# - Copiar contenido de supabase/migrations/001_initial_schema.sql
# - Ejecutar en SQL Editor de Supabase
# - Copiar contenido de supabase/migrations/002_rls_policies.sql
# - Ejecutar en SQL Editor
```

### 4. Generar tipos TypeScript (opcional)

```bash
# Con Supabase CLI (requiere Docker):
npm run types:gen

# O copiar y editar manualmente src/lib/types/database.types.ts
```

### 5. Ejecutar tests

```bash
npm test
```

## Características Implementadas

### 1. Schema SQL Completo
- **Tablas:** areas, employees, planning_daily, monthly_targets, weekly_patterns, user_roles, audit_log
- **Tipos Enum:** attendance_status (P/T/V/L), user_role (ADMIN/SUPERVISOR/VIEWER), audit_action
- **Triggers:**
  - `fn_set_updated_at()` → actualiza `updated_at` en todas las tablas
  - `fn_audit_log()` → registra cambios en audit_log (INSERT/UPDATE/DELETE)
  - `fn_validate_plan_date()` → valida fechas ≤ 3 días en el futuro
- **Índices:** optimizados para queries frecuentes (area_id, employee_id, plan_date)

### 2. Seguridad con RLS
- **Lectura:**
  - Datos activos públicos (areas, employees, planning_daily)
  - Funciones auxiliares: `fn_user_can_manage_area()`, `fn_user_is_admin()`
- **Escritura:**
  - ADMIN: acceso global
  - SUPERVISOR: por área asignada
  - Validaciones de negocio en DB
- **Auditoría:**
  - audit_log inmutable (no UPDATE/DELETE)
  - Tracking automático de cambios

### 3. Cliente Supabase Tipado
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('is_active', true);
```
- Tipos generados desde Database interface
- IntelliSense completo en TypeScript
- Error handling tipado

### 4. CRUD Validado
**Empleados:**
```typescript
import { createEmployee, updateEmployee, getActiveEmployees } from '@/lib/crud/employees';

// Validación Zod + Supabase types
const emp = await createEmployee({
  employee_code: 'EMP001',
  first_name: 'Juan',
  area_id: 'uuid-here',
  fte_percentage: 100, // 1-100 validado
});
```

**Planificación (Bulk insert):**
```typescript
import { bulkInsertPlanningDaily } from '@/lib/crud/planning';

// Validaciones:
// - horas_worked: 0-12
// - status: P/T/V/L
// - plan_date ≤ 3 días futuro
// - sin duplicados empleado/fecha
const records = await bulkInsertPlanningDaily([
  {
    employee_id: 'uuid',
    plan_date: '2026-05-12',
    status: 'P',
    hours_worked: 8,
    created_by: 'user-uuid'
  }
]);
```

### 5. Motor FTE
```typescript
import { calculateMonthlyTarget, computeFteTargetWithAlert } from '@/lib/fte/calculator';

// Cálculo: meta_mensual = Σ(semanas_en_mes × horas_patrón × fte%/100)
const target = calculateMonthlyTarget(pattern, ftePercentage, 2026, 5);

// Desviación con alerta < -10%
const result = computeFteTargetWithAlert(
  actualHours,
  pattern,
  ftePercentage,
  2026, 5
);

if (result.alert) {
  console.warn(`Desviación: ${result.deviationPct}%`);
}
```

### 6. Exportación Excel
```typescript
import { buildPlanningWorkbook } from '@/lib/export/excel';

const workbook = await buildPlanningWorkbook(rows);
await workbook.xlsx.writeFile('planning.xlsx');
```
- Hoja "Resumen": áreas, totales horas, drill-down links
- Hoja "Detalle": empleados, fechas, estados, notas
- Formato idéntico al original (columnas, estilos)

### 7. Importación Excel (Dry-run)
```typescript
import { parsePlanningExcelDryRun } from '@/lib/migration/excel-import';

const { rows, errors } = await parsePlanningExcelDryRun('data.xlsx');
if (errors.length > 0) {
  console.log('Validación fallida:', errors);
} else {
  // proceder a inserción
}
```

### 8. Tests Jest
```bash
npm test

# Resultados esperados:
# PASS tests/fte.test.ts
# PASS tests/employees.test.ts
# PASS tests/planning.test.ts
# Tests: 6 passed, 6 total
```

## Operación

### Crear área
```typescript
const { data, error } = await supabase
  .from('areas')
  .insert({ code: 'OPER', name: 'Operaciones' });
```
Requiere rol ADMIN.

### Crear empleado
```typescript
const emp = await createEmployee({
  employee_code: 'EMP001',
  first_name: 'Juan',
  last_name: 'Pérez',
  area_id: 'area-uuid',
  fte_percentage: 100
});
```
Requiere rol ADMIN o SUPERVISOR del área.

### Planificar turnos
```typescript
const planning = await bulkInsertPlanningDaily([
  {
    employee_id: 'emp-uuid',
    plan_date: '2026-05-12',
    status: 'P',
    hours_worked: 8,
    created_by: 'user-uuid'
  }
]);
```
Requiere rol ADMIN o SUPERVISOR del área del empleado.

### Calcular desviación FTE
```typescript
const result = computeFteTargetWithAlert(
  monthActualHours, pattern, fte%, year, month
);
console.log(`Meta: ${result.targetHours}h, Desviación: ${result.deviationPct}%`);
if (result.alert) alert('Alerta: desviación < -10%');
```

## Próximos Pasos

1. **API REST (Next.js):**
   - `/api/employees` - CRUD
   - `/api/planning` - GET/POST
   - `/api/export/excel` - descargar
   - `/api/migrate/excel` - cargar

2. **Frontend UI:**
   - Formularios empleados
   - Tabla interactiva planificación
   - Dashboard FTE con gráficos
   - Carga Excel con preview

3. **Autenticación:**
   - Integrar Supabase Auth
   - Login/signup con email
   - Roles basados en BD

4. **Real-time:**
   - Suscripciones Supabase
   - Actualización automática UI

## Troubleshooting

### "Docker Desktop is a prerequisite for local development"
- Supabase CLI necesita Docker para `supabase db push` en local
- Alternativa: usar Supabase Dashboard SQL Editor directamente

### Tipos TypeScript "never"
- El archivo `database.types.ts` requiere `Relationships: []` en cada tabla
- Está pre-generado; si se modifica schema, regenerar con CLI

### RLS "42501" (permission denied)
- Confirmar rol usuario en `user_roles`
- Verificar área en `user_roles.area_id`
- ADMIN debe tener `area_id = NULL`

## Soporte y Versiones

- **Node.js:** ≥18.0.0
- **TypeScript:** 5.4.5
- **Supabase:** v2.43.4
- **Next.js:** 14.2.3
- **Jest:** 29.7.0
- **ExcelJS:** 4.4.0

## Licencia
Confidencial - Uso interno únicamente.
