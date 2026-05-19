-- ============================================================
-- FASE 5: SEGUIMIENTO DE CHARLAS DE SEGURIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_talks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  talk_date    DATE         NOT NULL,
  topic        VARCHAR(255) NOT NULL,
  created_by   UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para consultas rápidas en el dashboard
CREATE INDEX idx_safety_talks_date ON safety_talks(talk_date);

-- Habilitar Auditoría
CREATE TRIGGER trg_safety_talks_audit 
  AFTER INSERT OR UPDATE OR DELETE ON safety_talks 
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

COMMENT ON TABLE safety_talks IS 'Registro de asistencia a charlas de seguridad de 5 minutos';