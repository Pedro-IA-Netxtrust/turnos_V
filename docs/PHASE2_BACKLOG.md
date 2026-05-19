# Backlog de Tareas - Fase 2: Registro Diario y Validaciones

**Objetivo:** Implementar un formulario funcional de registro diario con validaciones clave, auditoría activa y integración con la landing page.

**Duración estimada:** 1-2 semanas  
**Prioridad:** Alta

---

## Tareas Fase 2

### T2.1: Crear componentes UI base
- [ ] Componente `DailyRegisterForm` (entrada de datos diarios)
- [ ] Componente `EmployeeSelector` (selector de empleado)
- [ ] Componente `DatePicker` (selector de fecha)
- [ ] Componente `HoursInput` (entrada validada de horas 0-12)
- [ ] Componente `StatusSelector` (selector de estado P/T/V/L)
- [ ] Componente `NotesField` (campo de notas opcional)
- [ ] Estilos consistentes con landing page (Dark mode)

### T2.2: Implementar validaciones en frontend
- [ ] Validar horas ≤ 12
- [ ] Validar que no sea más de 72 horas atrás
- [ ] Validar que la fecha no sea futura (excepto 3 días)
- [ ] Mostrar mensajes de error en tiempo real
- [ ] Deshabilitar guardar si hay errores

### T2.3: Integrar con backend (Supabase)
- [ ] Conectar función `bulkInsertPlanningDaily()` para guardar
- [ ] Manejar errores de Supabase
- [ ] Mostrar indicador de "Guardando..." durante la operación
- [ ] Confirmar guardado exitoso con toast/notificación

### T2.4: Implementar auditoría
- [ ] Capturar usuario (modo admin con ID ficticio)
- [ ] Capturar timestamp de cada operación
- [ ] Registrar cambios en `audit_log` automáticamente
- [ ] Crear vista de historial de cambios por registro

### T2.5: Crear tabla de visualización
- [ ] Mostrar registros del empleado seleccionado
- [ ] Filtrar por rango de fechas
- [ ] Mostrar: Fecha | Empleado | Estado | Horas | Notas | Auditoría
- [ ] Permitir edición de registros (si cumple criterios)
- [ ] Permitir eliminar registros con confirmación

### T2.6: Integrar en la landing page
- [ ] Agregar link a "Registro Diario" en la navegación
- [ ] Crear página `/registro` que muestre el formulario
- [ ] Agregar breadcrumb o navegación de contexto
- [ ] Estilo consistente con Hero y resto de UI

### T2.7: Pruebas
- [ ] Probar validaciones con casos límite
- [ ] Verificar auditoría en `audit_log`
- [ ] Probar con 10+ registros simultáneos
- [ ] Verificar performance con 500+ empleados en selector

### T2.8: Documentación
- [ ] Documenta las reglas de validación
- [ ] Crea guía de uso para registro diario
- [ ] Actualiza `PHASE2_STATUS.md`

---

## Criterios de aceptación

- ✅ Validaciones funcionan en tiempo real
- ✅ Sin errores de TypeScript
- ✅ Auditoría registra 100% de operaciones
- ✅ UI responsive y accesible
- ✅ Tiempo de guardado <1s
- ✅ Mensajes de error claros en español

---

## Riesgos conocidos

- Performance con 500+ empleados en selector (solución: implementar busca/paginación)
- Sincronización de timestamp cliente/servidor (solución: usar timestamp del servidor)
- Bloqueo de edición >72h vs zona horaria (solución: usar DATE, no TIMESTAMP)
