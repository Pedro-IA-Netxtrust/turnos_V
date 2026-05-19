"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { RightPanel } from './RightPanel';
import { EmployeeModal } from './EmployeeModal';
import { getActiveAreas } from '../lib/crud/areas';

interface Props {
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname() || '/dashboard';
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const [safetyCount, setSafetyCount] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [areas, setAreas] = useState<{id:string;name:string}[]>([]);

  useEffect(() => {
    // initialize theme from document attribute if present
    try {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') setTheme(attr as 'light' | 'dark');
    } catch (e) {}

    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [presentRes, safetyRes] = await Promise.all([
        supabase
          .from('planning_daily')
          .select('*', { count: 'exact', head: true })
          .eq('plan_date', today)
          .eq('status', 'P'),
        supabase
          .from('safety_talks')
          .select('*', { count: 'exact', head: true })
          .eq('talk_date', today)
      ]);

      if (!presentRes.error) setPresentCount(presentRes.count);
      if (!safetyRes.error) setSafetyCount(safetyRes.count);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // listen for global event to open add employee modal
    const handler = () => setShowEmployeeModal(true);
    window.addEventListener('open-add-employee', handler as EventListener);
    return () => window.removeEventListener('open-add-employee', handler as EventListener);
  }, []);

  useEffect(() => {
    // fetch areas for employee form
    getActiveAreas()
      .then((res) => setAreas(res.map((a) => ({ id: a.id, name: a.name }))))
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    // refresh areas when a new area is created elsewhere
    const handler = () => {
      getActiveAreas()
        .then((res) => setAreas(res.map((a) => ({ id: a.id, name: a.name }))))
        .catch(() => setAreas([]));
    };
    window.addEventListener('area-created', handler as EventListener);
    return () => window.removeEventListener('area-created', handler as EventListener);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  }, [theme]);

  const menuItems = [
    { id: 'dashboard', label: 'Consolidación', icon: '📊', path: '/dashboard' },
    { id: 'registro', label: 'Registro Diario', icon: '📝', path: '/registro' },
    { id: 'planificador', label: 'Planificador 12 Meses', icon: '📅', path: '/planificador' },
    { id: 'personal', label: 'Personal (HR)', icon: '👥', path: '/personal' },
    { id: 'recursos', label: 'Recursos', icon: '🚗', path: '/recursos' },
  ];

  const getActiveId = () => {
    if (pathname.startsWith('/registro')) return 'registro';
    if (pathname.startsWith('/planificador')) return 'planificador';
    if (pathname.startsWith('/personal')) return 'personal';
    if (pathname.startsWith('/recursos')) return 'recursos';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const activePage = getActiveId();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img src="/monitoring-logo.svg" alt="Monitoring Gestión de Activos" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter italic">ASISTENCIA<span className="text-blue-500">FAENA</span></h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Gestión de HH & FTE</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              aria-current={activePage === item.id ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${activePage === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-900/5' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs">AD</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Administrador</p>
              <p className="text-[10px] text-slate-500 truncate">Modo de Producción</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar opcional */}
        <header className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="capitalize">{activePage}</span>
            <span className="opacity-30">/</span>
            <span className="text-slate-300 font-medium">Sistema Principal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors outline-none focus:ring-1 focus:ring-blue-500"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen Diario</span>
                <span className="text-xs font-mono font-bold text-white">
                  {presentCount !== null ? presentCount : '--'}
                </span>
                <svg className={`w-3 h-3 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-800/50 mb-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen Diario</p>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-default">
                    <span className="text-xs text-slate-400 font-semibold">Presentes</span>
                    <span className="text-xs font-mono font-bold text-green-500">{presentCount ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-default">
                    <span className="text-xs text-slate-400 font-semibold">Charlas Seg.</span>
                    <span className="text-xs font-mono font-bold text-yellow-500">{safetyCount ?? '--'}</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Alternar tema"
              className="p-2 rounded-md bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={() => setIsRightOpen(true)}
              title="Abrir panel lateral"
              className="p-2 rounded-md bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              ⚙️
            </button>
             <button className="text-xs font-bold bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
               Soporte Técnico
             </button>
          </div>
        </header>

        {/* Área de Scroll de la página */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 content-area">
            {children}
          </div>
        </div>
      </main>
      <RightPanel isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} onAddClick={() => {
        const ev = new CustomEvent('open-add-employee');
        window.dispatchEvent(ev);
      }} />

      {showEmployeeModal && (
        <EmployeeModal
          areas={areas}
          onClose={() => setShowEmployeeModal(false)}
          onSuccess={() => {
            setShowEmployeeModal(false);
            // optionally refresh data
          }}
        />
      )}
    </div>
  );
};