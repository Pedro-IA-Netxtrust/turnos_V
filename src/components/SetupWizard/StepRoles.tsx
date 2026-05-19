'use client';

import { useState } from 'react';
import { createInitialAdmin } from '@/services/seedService';

interface StepRolesProps {
  wizardData: any;
  updateWizardData: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepRoles({ wizardData, updateWizardData, onNext, onPrev }: StepRolesProps) {
  const [adminEmail, setAdminEmail] = useState(wizardData.adminEmail || '');
  const [adminPassword, setAdminPassword] = useState(wizardData.adminPassword || '');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword) return;

    setCreating(true);
    const res = await createInitialAdmin(adminEmail, adminPassword);
    setResult(res);
    setCreating(false);

    if (res.success) {
      updateWizardData('adminEmail', adminEmail);
      updateWizardData('adminPassword', adminPassword);
    }
  };

  return (
    <div className="step-container">
      <h2>Crear Usuario Administrador</h2>
      <p>Establece las credenciales del primer usuario administrador del sistema.</p>

      <section className="admin-creation">
        <div className="form-group">
          <label>Email del Admin:</label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@empresa.com"
          />
        </div>
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Contraseña segura"
          />
        </div>
        <button
          type="button"
          onClick={handleCreateAdmin}
          disabled={creating || !adminEmail || !adminPassword}
        >
          {creating ? 'Creando...' : 'Crear Admin'}
        </button>
        {result && (
          <div className={`result ${result.success ? 'success' : 'error'}`}>
            {result.success ? 'Admin creado exitosamente' : `Error: ${result.error}`}
          </div>
        )}
      </section>

      <div className="step-actions">
        <button type="button" onClick={onPrev}>Anterior</button>
        <button type="button" onClick={onNext} disabled={!result?.success}>
          Siguiente: Empleados
        </button>
      </div>
    </div>
  );
}
