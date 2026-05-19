'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const lineData = {
  labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  datasets: [
    {
      label: 'Activos monitoreados',
      data: [120, 158, 173, 183, 194, 210],
      borderColor: '#F29100',
      backgroundColor: 'rgba(242, 145, 0, 0.14)',
      tension: 0.38,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: '#F29100',
    },
  ],
};

const barData = {
  labels: ['Infra', 'Planta', 'Red', 'Sensores'],
  datasets: [
    {
      label: 'Disponibilidad (%)',
      data: [98, 94, 96, 91],
      borderRadius: 8,
      backgroundColor: ['#1A367C', '#1A367C', '#F29100', '#1A367C'],
    },
  ],
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111c3a',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#33417e',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: '#c7d1ec', font: { size: 12 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.08)' },
      ticks: { color: '#c7d1ec', font: { size: 12 } },
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111c3a',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#33417e',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      ticks: { color: '#c7d1ec', font: { size: 13 } },
      grid: { display: false },
    },
  },
};

const serviceCards = [
  {
    title: 'Monitoreo de activos',
    text: 'Visibilidad continua de cada equipo con alertas inteligentes y trazabilidad completa.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zm0 7L2 9l10 5 10-5-10 5z',
  },
  {
    title: 'Analítica predictiva',
    text: 'Datos históricos traducidos en recomendaciones para aumentar uptime y eficiencia.',
    icon: 'M4 17h16v2H4zm7-12h2v10h-2zm-4 4h2v6H7zm8-8h2v14h-2z',
  },
  {
    title: 'Estado del sistema',
    text: 'Indicadores en tiempo real con semáforos virtuales para riesgos y prioridades.',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a2 2 0 110 4 2 2 0 010-4zm0 6a2 2 0 110 4 2 2 0 010-4z',
  },
  {
    title: 'Integración segura',
    text: 'Conexiones robustas con APIs e infraestructuras que respetan cumplimiento industrial.',
    icon: 'M12 1a11 11 0 00-4.9 21.2l.9-1.8A8.9 8.9 0 1112 3a8.9 8.9 0 01-4.2 16.8l-.9 1.8A11 11 0 0012 1zm1 5h-2v6h2zm0 8h-2v2h2z',
  },
];

const statusIndicators = [
  { label: 'Sistemas críticos', status: 'Operational', color: 'green' },
  { label: 'Alertas pendientes', status: 'Review', color: 'orange' },
  { label: 'Conexiones', status: 'Partial', color: 'red' },
];

function ServiceIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="service-icon">
      <path d={path} />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <header className="hero-header">
          <div className="brand-group">
            <div className="logo-badge">V</div>
            <div>
              <p className="micro-label">Asset Management & Monitoring</p>
              <h1>Inteligencia operacional para activos críticos.</h1>
            </div>
          </div>
          <nav className="top-nav">
            <a href="#servicios">Servicios</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#estado">Estado</a>
            <a href="/registro">Registro Diario</a>
            <a href="/planificador">Planificador</a>
            <a href="/configuracion">Configuración</a>
          </nav>
        </header>

        <div className="hero-body">
          <div className="hero-copy">
            <span className="eyebrow">Control industrial de nueva generación</span>
            <h2>Gestión de activos con visibilidad en tiempo real y análisis predictivo.</h2>
            <p>
              Plataforma diseñada para infraestructuras complejas: monitorea operaciones, anticipa fallos y actúa con
              información segura y accionable.
            </p>
            <div className="hero-actions">
              <a className="cta-button" href="#dashboard">
                Get Started
              </a>
              <a className="ghost-button" href="#servicios">
                Explorar plataforma
              </a>
            </div>
            <div className="hero-facts">
              <div>
                <strong>+210</strong>
                <span>activos monitoreados</span>
              </div>
              <div>
                <strong>99.2%</strong>
                <span>disponibilidad media</span>
              </div>
              <div>
                <strong>4.8x</strong>
                <span>mejor detección anticipada</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card">
              <div className="status-strip">
                <span>Live Overview</span>
                <div className="pulse-dot" />
              </div>
              <div className="hero-visual-grid">
                <div className="metric-box blue">
                  <span>Operaciones activas</span>
                  <strong>184</strong>
                </div>
                <div className="metric-box light">
                  <span>Alertas</span>
                  <strong>12</strong>
                </div>
                <div className="metric-box orange">
                  <span>Tiempo de respuesta</span>
                  <strong>1.4 min</strong>
                </div>
                <div className="metric-box muted">
                  <span>Conexiones</span>
                  <strong>192</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="services-section">
        <div className="section-header">
          <p className="section-label">Servicios clave</p>
          <h3>Capacidades modulares para operaciones inteligentes.</h3>
        </div>
        <div className="service-grid">
          {serviceCards.map((item) => (
            <article key={item.title} className="service-card">
              <div className="icon-wrapper">
                <ServiceIcon path={item.icon} />
              </div>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="dashboard" className="dashboard-section">
        <div className="dashboard-header">
          <div>
            <p className="section-label">Vista de control</p>
            <h3>Mockup de dashboard con métricas de crecimiento y salud.</h3>
          </div>
          <div className="status-pill">Modo Dark nativo</div>
        </div>

        <div className="dashboard-layout">
          <div className="dashboard-panel card-glass">
            <div className="dashboard-summary">
              <div>
                <span>Rendimiento total</span>
                <strong>+24.7%</strong>
              </div>
              <div>
                <span>Activos bajo observación</span>
                <strong>210</strong>
              </div>
            </div>
            <div className="chart-frame">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          <div className="dashboard-panel card-glass status-panel">
            <div className="status-grid">
              {statusIndicators.map((item) => (
                <div key={item.label} className="status-item">
                  <div className={`status-led ${item.color}`} />
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.status}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="bar-chart-frame">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </section>

      <section id="estado" className="bottom-panel">
        <div className="bottom-copy">
          <p className="section-label">Estado del sistema</p>
          <h3>Panel de monitoreo industrial con indicadores de riesgo indicativos.</h3>
          <p>
            Visualiza la salud de tu infraestructura, identifica cuellos de botella y prioriza acciones críticas con un
            diseño minimalista que reduce la fatiga visual.
          </p>
        </div>
        <div className="status-cards">
          <div className="status-card">
            <span>Visibilidad</span>
            <strong>Tiempo real</strong>
            <p>Canales persistentes para datos de sensores y activos, escalables para mantenimiento predictivo.</p>
          </div>
          <div className="status-card accent-card">
            <span>Respuesta</span>
            <strong>Automatizada</strong>
            <p>Alertas segmentadas y paneles de acción que aceleran la resolución de eventos críticos.</p>
          </div>
          <div className="status-card">
            <span>Seguridad</span>
            <strong>Resistente</strong>
            <p>Arquitectura preparada para integración de APIs confiables y acceso con trazabilidad.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
