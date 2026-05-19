-- ============================================================
-- SISTEMA ASISTENCIA FAENA - Modo admin sin autenticación formal
-- Versión: 1.2.0 | Fecha: 2026-05-12
-- Ajustes para permitir inserción en planning_daily sin usuario auth
-- ============================================================

ALTER TABLE IF EXISTS planning_daily
  ALTER COLUMN created_by DROP NOT NULL;

COMMENT ON COLUMN planning_daily.created_by IS 'Creado por admin/usuario. En modo admin puede ser NULL.';
