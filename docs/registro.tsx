import React, { useState } from 'react';
import { DailyRegisterForm } from '@/components/DailyRegisterForm';
import { EmployeeSelector } from '@/components/EmployeeSelector';
import { EmployeeHistoryTable } from '@/components/EmployeeHistoryTable';
import type { EmployeeLookup } from '@/lib/crud/employees';
import { MainLayout } from '@/components/MainLayout';
import { SafetyTalkForm } from '@/components/SafetyTalkForm';

const RegistroPage = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLookup | null>(null);
  const [activeTab, setActiveTab] = useState<'asistencia' | 'seguridad'>('asistencia');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // Incrementar key para forzar recarga de componentes si fuera necesario
    setRefreshKey(prev => prev + 1);
    // Opcional: Deseleccionar empleado tras guardar
    // setSelectedEmployee(null);
  };

  return (
    <MainLayout activePage="registro">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Asistencia</h1>
          <p className="text-slate-400 mt-1">Fase 2: Registro diario y validación de reglas de negocio</p>
        </header>
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Panel Lateral: Selección */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Personal Faena
              </h2>
              <EmployeeSelector 
                onSelect={setSelectedEmployee} 
                selectedId={selectedEmployee?.id}
              />
            </div>
          </div>
          {/* Panel Principal: Formulario */}
          <div className="lg:col-span-8">
            {selectedEmployee ? (
              <div className="space-y-8">
                {/* Navegación de Pestañas */}
                <div className="flex gap-6 border-b border-slate-800">
                  <button 
                    onClick={() => setActiveTab('asistencia')}
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                      activeTab === 'asistencia' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    Asistencia y HH
                  </button>
                  <button 
                    onClick={() => setActiveTab('seguridad')}
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                      activeTab === 'seguridad' ? 'text-yellow-500 border-yellow-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    Charla de Seguridad
                  </button>
                </div>

                {activeTab === 'asistencia' ? (
                  <>
                    <DailyRegisterForm 
                      key={`form-${selectedEmployee.id}-${refreshKey}`}
                      employeeId={selectedEmployee.id}
                      employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                      onSuccess={handleSuccess}
                    />
                
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
                      <h2 className="text-lg font-semibold text-white mb-4">Historial Reciente (30 días)</h2>
                      <EmployeeHistoryTable 
                        employeeId={selectedEmployee.id}
                        refreshKey={refreshKey}
                      />
                    </div>
                  </>
                ) : (
                  <div className="max-w-2xl">
                    <SafetyTalkForm 
                      onSuccess={handleSuccess}
                      employeeId={selectedEmployee.id}
                      employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-300">No hay selección</h3>
                <p className="text-slate-500 max-w-xs mt-2">
                  Seleccione un empleado del panel lateral para registrar su jornada de hoy o planificar los próximos días.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegistroPage;