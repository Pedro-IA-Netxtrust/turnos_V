'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StepPatterns from './StepPatterns';
import StepAreas from './StepAreas';
import StepRoles from './StepRoles';
import StepEmployees from './StepEmployees';
import StepReview from './StepReview';
import './styles.css';

const steps = [
  { id: 'patterns', title: 'Patrones Semanales', component: StepPatterns },
  { id: 'areas', title: 'Áreas', component: StepAreas },
  { id: 'roles', title: 'Roles y Admin', component: StepRoles },
  { id: 'employees', title: 'Empleados', component: StepEmployees },
  { id: 'review', title: 'Revisión y Commit', component: StepReview },
];

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado global del wizard
  const [wizardData, setWizardData] = useState({
    patterns: [] as any[],
    areas: [] as any[],
    roles: [] as any[],
    employees: [] as any[],
    adminEmail: '',
    adminPassword: '',
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      // Verificar si hay usuarios con roles (si está vacío, permitir setup)
      const { data: roles } = await supabase.from('user_roles').select('id').limit(1);
      const isEmpty = !roles || roles.length === 0;

      if (isEmpty) {
        setIsAuthorized(true);
      } else {
        // Verificar si usuario actual es admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

          setIsAuthorized(userRole?.role === 'ADMIN');
        } else {
          setIsAuthorized(false);
        }
      }
    } catch (error) {
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const updateWizardData = (key: string, value: any) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return <div className="loading">Verificando permisos...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="unauthorized">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder al módulo de configuración inicial.</p>
        <p>Este módulo solo está disponible cuando la base de datos está vacía o para usuarios con rol ADMIN.</p>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep]?.component as React.FC<any> | undefined;

  if (!CurrentStepComponent) return null;

  return (
    <div className="setup-wizard">
      <header className="wizard-header">
        <h1>Configuración Inicial del Sistema</h1>
        <div className="progress-bar">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="wizard-content">
        <CurrentStepComponent
          wizardData={wizardData}
          updateWizardData={updateWizardData}
          onNext={nextStep}
          onPrev={prevStep}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
        />
      </main>
    </div>
  );
}
