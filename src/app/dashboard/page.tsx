"use client";

import React, { useEffect, useState } from 'react';
import { getActiveEmployees, type EmployeeRow } from '../../lib/crud/employees';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  useEffect(() => {
    getActiveEmployees()
      .then((res) => setEmployees(res || []))
      .catch(() => setEmployees([]));
  }, []);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{margin:0}}>Control Maestro</h2>
          <p style={{margin:0,color:'var(--muted)'}}>Vista principal · escritorio</p>
        </div>
        <div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-employee'))} className="bg-blue-600 text-white px-4 py-2 rounded-md">Agregar personal</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{color:'var(--muted)'}}>Total empleados</div>
          <div style={{fontSize:22,fontWeight:700}}>{employees.length}</div>
        </div>
        <div className="kpi-card">
          <div style={{color:'var(--muted)'}}>Presentes hoy</div>
          <div style={{fontSize:22,fontWeight:700}}>--</div>
        </div>
        <div className="kpi-card">
          <div style={{color:'var(--muted)'}}>Alertas</div>
          <div style={{fontSize:22,fontWeight:700}}>12</div>
        </div>
        <div className="kpi-card">
          <div style={{color:'var(--muted)'}}>Disponibilidad</div>
          <div style={{fontSize:22,fontWeight:700}}>99.2%</div>
        </div>
      </div>

      <div style={{marginTop:20}}>
        <table className="table-large">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Área</th>
              <th>FTE</th>
              <th>Contrato</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.employee_code}</td>
                <td>{e.first_name} {e.last_name}</td>
                <td>{e.area_id}</td>
                <td>{e.fte_percentage}</td>
                <td>{e.contract_type}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} style={{padding:20,color:'var(--muted)'}}>No hay empleados registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
