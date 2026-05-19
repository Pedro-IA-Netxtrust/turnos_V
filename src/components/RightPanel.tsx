import React, { useState } from 'react';
import { createArea } from '../lib/crud/areas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddClick: () => void;
}

export const RightPanel: React.FC<Props> = ({ isOpen, onClose, onAddClick }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateArea = async () => {
    setMessage(null);
    if (!code.trim() || !name.trim()) {
      setMessage('Código y nombre son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await createArea({ code: code.trim(), name: name.trim() });
      setMessage('Área creada correctamente.');
      setCode('');
      setName('');
      // notify global listeners to refresh areas
      window.dispatchEvent(new CustomEvent('area-created'));
    } catch (err: any) {
      setMessage('Error al crear área: ' + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="right-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Panel de configuración</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">Cerrar</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Acciones rápidas</p>
        <button onClick={onAddClick} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md">Agregar Personal</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Crear área de trabajo</p>
        <div style={{ marginTop: 8 }}>
          <label className="text-[13px]" style={{ display: 'block', color: 'var(--muted)' }}>Código</label>
          <input value={code} onChange={e => setCode(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none mt-2" />
          <label className="text-[13px] mt-3" style={{ display: 'block', color: 'var(--muted)' }}>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none mt-2" />
          <button onClick={handleCreateArea} disabled={loading} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md">
            {loading ? 'Creando...' : 'Crear Área'}
          </button>
          {message && <div className="text-sm mt-2" style={{ color: message.startsWith('Error') ? '#f87171' : '#34d399' }}>{message}</div>}
        </div>
      </div>
    </aside>
  );
};
