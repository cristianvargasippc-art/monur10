import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : {}}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [checkinStats, setCheckinStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/participants/stats'),
      api.get('/volunteers/stats'),
      user?.role === 'sga_regional' ? api.get('/checkin/stats') : Promise.resolve(null),
    ]).then(([pRes, vRes, cRes]) => {
      setStats({ participants: pRes.data, volunteers: vRes.data });
      if (cRes) setCheckinStats(cRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading"><div className="spinner" />Cargando datos...</div>;

  const pTotal = stats?.participants?.total || 0;
  const pChecked = stats?.participants?.checked_in || 0;
  const pPct = pTotal > 0 ? Math.round((pChecked / pTotal) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h2>Tablero General</h2>
        <div className="gold-line" />
        <p>
          {user?.role === 'sga_regional'
            ? 'Vision general del Modelo ONU Regional 10'
            : `Panel de gestion — Distrito ${user?.district_code}`}
        </p>
      </div>

      {/* STATS PRINCIPALES */}
      <div className="stats-grid">
        <StatCard value={pTotal} label="Delegados registrados" />
        <StatCard value={pChecked} label="Check-In realizado" color="var(--gold-light)" />
        <StatCard value={pTotal - pChecked} label="Pendientes de Check-In" />
        <StatCard value={`${pPct}%`} label="Porcentaje de asistencia" color={pPct >= 80 ? '#4caf82' : pPct >= 50 ? '#e8b84b' : '#e74c3c'} />
        <StatCard value={stats?.volunteers?.total || 0} label="Voluntarios registrados" />
        <StatCard value={stats?.volunteers?.staff || 0} label="Staff del modelo" />
        <StatCard value={stats?.volunteers?.mesa_directiva || 0} label="Mesa directiva" />
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">Progreso de Check-In</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--silver)', marginBottom: '0.5rem' }}>
          <span>{pChecked} de {pTotal} delegados</span>
          <span>{pPct}% completado</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pPct}%` }} />
        </div>
      </div>

      {/* TABLA POR DISTRITO (solo SGA) */}
      {user?.role === 'sga_regional' && checkinStats?.by_district && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Estado por Distrito</div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Distrito</th>
                  <th>Total Delegados</th>
                  <th>Check-In</th>
                  <th>Progreso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {checkinStats.by_district.map(d => {
                  const pct = d.total_participants > 0
                    ? Math.round((d.checked_in / d.total_participants) * 100) : 0;
                  return (
                    <tr key={d.code}>
                      <td>
                        <strong style={{ color: 'var(--gold-light)' }}>{d.code}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--silver)' }}>{d.name}</div>
                      </td>
                      <td>{d.total_participants}</td>
                      <td>{d.checked_in || 0}</td>
                      <td style={{ minWidth: '120px' }}>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--silver)', marginTop: '0.2rem', display: 'block' }}>{pct}%</span>
                      </td>
                      <td>
                        <span className={`badge ${pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {pct >= 80 ? 'Excelente' : pct >= 50 ? 'En progreso' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACCESOS RAPIDOS */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        <a href="/checkin" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Acceso Publico</div>
            <div style={{ fontFamily: 'Playfair Display, serif', color: 'var(--white)' }}>Pagina de Check-In</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--silver)', marginTop: '0.25rem' }}>Comparta este enlace con los delegados</div>
          </div>
        </a>
        <a href="/registro-voluntario" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Acceso Publico</div>
            <div style={{ fontFamily: 'Playfair Display, serif', color: 'var(--white)' }}>Registro Voluntarios</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--silver)', marginTop: '0.25rem' }}>Formulario abierto para voluntarios</div>
          </div>
        </a>
      </div>
    </div>
  );
}