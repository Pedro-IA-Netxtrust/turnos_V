# RLS y Flujo de Aprobación - Asistencia Faena

## Objetivo
Documentar las políticas de RLS implementadas en Supabase y el flujo de autorización para la gestión de datos de asistencia.

## Diseño de RLS

### Tablas cubiertas
- `areas`
- `employees`
- `weekly_patterns`
- `monthly_targets`
- `planning_daily`
- `user_roles`
- `audit_log`

### Políticas generales
- Lectura pública para registros activos:
  - `areas` con `is_active = TRUE`
  - `employees` con `is_active = TRUE`
  - `weekly_patterns` y `monthly_targets` solo si el área asociada está activa
  - `planning_daily` solo si el empleado asociado está activo
- Escritura limitada a usuarios con rol `ADMIN` o `SUPERVISOR`:
  - `areas` = solo `ADMIN`
  - `employees`, `weekly_patterns`, `monthly_targets`, `planning_daily` = `ADMIN` o `SUPERVISOR` del área correspondiente
  - `user_roles` = solo `ADMIN`
- Auditoría inmutable:
  - `audit_log` no permite UPDATE ni DELETE directos
  - Su contenido solo se puede leer con rol `ADMIN`
  - Los cambios se capturan mediante triggers `fn_audit_log()`

## Funciones auxiliares
- `fn_user_can_manage_area(area_id)`:
  - Devuelve `TRUE` cuando el usuario actual es `ADMIN` o `SUPERVISOR` del área
- `fn_user_is_admin()`:
  - Devuelve `TRUE` cuando el usuario actual tiene rol `ADMIN`
- `fn_user_can_read_area(area_id)`:
  - Comprueba que el área existe y está activa

## Flujo de aprobación y gestión

1. Un usuario con rol `ADMIN` o `SUPERVISOR` crea o actualiza un empleado en `employees`.
2. La planificación diaria se registra en `planning_daily` y se valida al `INSERT`:
   - horas máximo 12
   - estados permitidos `P`, `T`, `V`, `L`
   - no se permite planificar más de 3 días en el futuro
3. Los cambios en `employees`, `planning_daily`, `monthly_targets` y `user_roles` quedan grabados en `audit_log` con:
   - tipo de acción (`INSERT`, `UPDATE`, `DELETE`)
   - datos antiguos y nuevos
   - usuario que realizó la modificación
4. El registro `audit_log` es inmutable y no puede modificarse directamente.

## Recomendaciones operativas
- Asignar roles en `user_roles` con `area_id` para supervisores y `NULL` para administradores globales.
- Usar `ADMIN` para crear áreas y gestionar accesos globales.
- Usar `SUPERVISOR` para planificar turnos y ajustar datos de empleados de su área.
- Supervisar desviaciones FTE en la capa de aplicación usando el motor de cálculo.
