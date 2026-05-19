'use client';

import { useState } from 'react';
import { seedWeeklyPatterns, seedAreas, seedEmployees } from '@/services/seedService';

interface StepReviewProps {
  wizardData: any;
  updateWizardData: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepReview({ wizardData, onPrev }: StepReviewProps) {
  const [committing, setCommitting] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  const handleCommit = async () => {
    setCommitting(true);

    const results = {
      patterns: await seedWeeklyPatterns(wizardData.patterns, false),
      areas: await seedAreas(wizardData.areas, false),
      employees: await seedEmployees(wizardData.employees, false),
    };

    const totalInserted = results.patterns.inserted + results.areas.inserted + results.employees.inserted;
    const totalErrors = results.patterns.errors.length + results.areas.errors.length + results.employees.errors.length;

    setFinalResult({
      success: totalErrors === 0,
      totalInserted,
      totalErrors,
      details: results,
    });

    setCommitting(false);
  };

  return (
    <div className="step-container">
      <h2>Revisión y Commit Final</h2>
      <p>Revisa los datos configurados antes de insertarlos en la base de datos.</p>

      <section className="review-summary">
        <div className="summary-item">
          <h3>Patrones Semanales</h3>
          <p>{wizardData.patterns?.length || 0} configurados</p>
        </div>
        <div className="summary-item">
          <h3>Áreas</h3>
          <p>{wizardData.areas?.length || 0} configuradas</p>
        </div>
        <div className="summary-item">
          <h3>Empleados</h3>
          <p>{wizardData.employees?.length || 0} configurados</p>
        </div>
        <div className="summary-item">
          <h3>Admin Creado</h3>
          <p>{wizardData.adminEmail ? 'Sí' : 'No'}</p>
        </div>
      </section>

      {!finalResult && (
        <section className="commit-section">
          <p><strong>Advertencia:</strong> Esta acción insertará datos reales en la base de datos. No se puede deshacer.</p>
          <button
            type="button"
            onClick={handleCommit}
            disabled={committing}
            className="commit-button"
          >
            {committing ? 'Insertando datos...' : 'Confirmar e Insertar Datos'}
          </button>
        </section>
      )}

      {finalResult && (
        <section className="final-result">
          <h3>Resultado Final</h3>
          <div className={`result-status ${finalResult.success ? 'success' : 'warning'}`}>
            {finalResult.success ? '✅ Configuración completada exitosamente' : '⚠️ Algunos errores ocurrieron'}
          </div>
          <div className="result-stats">
            <p>Total insertados: {finalResult.totalInserted}</p>
            <p>Total errores: {finalResult.totalErrors}</p>
          </div>
          {finalResult.totalErrors > 0 && (
            <details>
              <summary>Ver detalles de errores</summary>
              <pre>{JSON.stringify(finalResult.details, null, 2)}</pre>
            </details>
          )}
          {finalResult.success && (
            <div className="success-message">
              <p>🎉 El sistema está listo para usar.</p>
              <p>Puedes iniciar sesión con: <strong>{wizardData.adminEmail}</strong></p>
            </div>
          )}
        </section>
      )}

      <div className="step-actions">
        <button type="button" onClick={onPrev} disabled={committing}>Anterior</button>
        {finalResult?.success && (
          <button type="button" onClick={() => window.location.href = '/'}>
            Ir al Inicio
          </button>
        )}
      </div>
    </div>
  );
}
