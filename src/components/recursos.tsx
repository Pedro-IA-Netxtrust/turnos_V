import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/MainLayout';
import { getActiveResources, type ResourceRow } from '../lib/crud/resources';
import { ResourceAssignmentModal } from './ResourceAssignmentModal';

const RecursosPage = () => {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<ResourceRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getActiveResources('CAMIONETA')
      .then(setResources)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <MainLayout activePage="recursos">
      {selectedResource && (
        <ResourceAssignmentModal
          resourceId={selectedResource.id}
          resourceCode={selectedResource.code}
          onClose={() => setSelectedResource(null)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            // Opcional: mostrar un toast de éxito
          }}
        />
      )}
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Gestión de Camionetas</h1>
            <p className="text-slate-400 text-lg">Control de flota y asignaciones por período</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            + Nueva Camioneta
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Cargando flota de vehículos...</div>
          ) : resources.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
              No hay vehículos registrados.
            </div>
          ) : (
            resources.map((res) => (
              <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 text-2xl">
                    🚗
                  </div>
                  <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-green-500/20">
                    Disponible
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-xl mb-1">{res.code}</h3>
                <p className="text-slate-400 text-sm font-medium mb-4">{res.name}</p>
                
                <div className="pt-4 border-t border-slate-800 flex gap-2">
                  <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                    Ver Historial
                  </button>
                  <button 
                    onClick={() => setSelectedResource(res)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Asignar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default RecursosPage;