# Implementación simplificada: Sistema de asistencia y planificación

## Objetivo
Construir una aplicación web desde cero que digitalice el registro y la planificación de asistencia faena y teletrabajo para un único rol administrador (modo admin). El sistema debe automatizar validaciones de jornadas, cálculo de metas FTE, consolidación jerárquica y generación de reportes PDF, sin dependencias de importación histórica ni exportación Excel.

## 1. Alcance y Componentes Principales

### Componentes del sistema
- Modo administrador único sin autenticación formal por el momento.
- CRUD de empleados, áreas y patrones semanales.
- Registro diario de asistencia con estados P/T/V/L.
- Planificador calendarizado horizontal para 12 meses.
- Motor FTE para cálculo de metas y desviación exacta.
- Dashboards jerárquicos y alertas visuales críticas.
- Gestión de recursos: camionetas y casinos.
- Generación de reportes PDF.
- Auditoría de cambios en `audit_log`.

## 2. Fases de Implementación

### Fase 1: Arquitectura y datos base
- Diseñar el esquema en Supabase para:
  - `areas`, `employees`, `weekly_patterns`, `monthly_targets`, `planning_daily`, `resource_assignments`, `audit_log`.
  - Tipos: `attendance_status`, `user_role` (solo ADMIN), `audit_action`, `resource_type`.
  - Triggers/procedimientos: `fn_set_updated_at()`, `fn_audit_log()`, validaciones de negocio.
- Crear cliente Supabase tipado y capa de acceso simple (CRUD + validaciones).
- No implementar RLS complejo todavía; usar modo admin.

### Fase 2: Registro diario y validaciones
- Implementar ingreso diario por empleado/día.
- Validaciones obligatorias:
  - horas ≤ 12.
  - edición bloqueada para fechas con más de 72 horas de antigüedad.
  - control de duplicados `employee + plan_date`.
- Registrar cada modificación en `audit_log` con usuario ficticio/admin, timestamp y cambios.

### Fase 3: Planificación calendarizada
- Crear vista calendario horizontal de 12 meses (Nov–Oct).
- Soportar edición masiva de estados.
- Incluir drag & drop para cambios rápidos de estado.
- Sincronizar patrones semanales con los periodos planificados.
- Optimizar para 500+ empleados en menos de 2s por consulta.

### Fase 4: Motor FTE y metas exactas
- Implementar el cálculo de metas:
  - `Meta = Σ(semanas_efectivas × horas_patron × FTE%)`.
- Asegurar coincidencia exacta con la lógica actual de las planillas.
- Mostrar desviación y alertar si está por debajo de -10%.

### Fase 5: Reportes jerárquicos y alertas visuales
- Construir dashboards jerárquicos:
  - Contrato → Gerencia → Sub-área → Empleado.
- Incluir métricas de:
  - HH Hombres/Mujeres.
  - Total faena/teletrabajo.
  - Charlas de seguridad.
  - Real vs Meta.
- Alertas visuales para:
  - desviación < -10%.
  - licencia > 5 días.
  - conflicto de asignación.
  - horas > 12.
- Sin envío de correo en esta etapa.

### Fase 6: Gestión de recursos
- Implementar asignación de camionetas y casinos por empleado y período.
- Validar disponibilidad y evitar solapamientos.
- Proveer reportes de ocupación por área.

### Fase 7: Reportes PDF
- Generar reportes PDF desde la aplicación.
- Incluir tablas de consolidación y datos jerárquicos.
- Asegurar que el PDF sea legible y adecuado para distribución.
- No se implementa exportación Excel.

## 3. Entregables por fase

### Entregable Fase 1
- Esquema de datos implementado.
- CRUD básico de empleados, áreas y patrones.
- Cliente Supabase tipado.
- **Página de configuración inicial funcional** (áreas, empleados, patrones semanales).

### Entregable Fase 2
- Registro diario funcional.
- Validaciones clave implementadas.
- Auditoría de cambios activa.

### Entregable Fase 3
- Planificador calendarizado con edición.
- Drag & drop básico de estados.
- Rendimiento optimizado para 500+ empleados.

### Entregable Fase 4
- Motor FTE operativo.
- Dashboard de metas y desviación.
- Cálculo replicable contra la lógica actual.

### Entregable Fase 5
- Dashboards jerárquicos.
- Alertas visuales en UI.
- Reportes de indicadores clave.

### Entregable Fase 6
- Gestión de recursos disponible.
- Validación de disponibilidad.
- Reportes de ocupación.

### Entregable Fase 7
- Reportes en formato PDF.
- Datos jerárquicos y consolidación en PDF.

## 4. Criterios de Éxito (KPIs)
- Reducción significativa del tiempo de consolidación mensual.
- Error de cálculo = 0 HH vs lógica de planillas.
- Tiempo de respuesta <2s para consultas de 500 empleados × 31 días.
- 100% de cambios registrados en `audit_log`.
- Reportes PDF legibles y útiles.

## 5. Recomendaciones de implementación
- Mantener la lógica de negocio en la aplicación y en funciones SQL.
- Iniciar con modo admin sin autenticación para acelerar la entrega.
- Priorizar validaciones de jornada y trazabilidad.
- Usar la menor complejidad posible mientras se prueban los cálculos.

## 6. Siguientes pasos inmediatos
1. Definir las reglas exactas de validación de jornadas y patrón FTE.
2. Ajustar el esquema para `planning_daily`, `monthly_targets` y `audit_log`.
3. Desarrollar primer prototipo de registro diario y tablero de validación.
4. Implementar generación de reportes PDF.
5. **Configuración inicial completada - listo para pruebas de datos.**
