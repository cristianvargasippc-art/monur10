import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Participants() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ check_in: '', search: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.check_in !== '') params.set('check_in', filter.check_in);
      const res = await api.get(`/participants?${params}`);
      setParticipants(res.data);
    } catch { toast.error('Error cargando delegados.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter.check_in]);

  const filtered = participants.filter(p =>
    !filter.search || p.full_name.toLowerCase().includes(filter.search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>Delegados</h2>
        <div className="gold-line" />
        <p>Lista completa de participantes registrados{user?.role === 'district_admin' ? ` en el Distrito ${user.district_code}` : ' en todos los distritos'}.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
            <label>Buscar por nombre</label>
            <input type="text" placeholder="Filtrar delegados..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
            <label>Estado Check-In</label>
            <select value={filter.check_in} onChange={e => setFilter({ ...filter, check_in: e.target.value })}>
              <option value="">Todos</option>
              <option value="1">Con Check-In</option>
              <option value="0">Pendientes</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={load} style={{ marginBottom: 0 }}>Actualizar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Registro de Delegados</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>{filtered.length} registros</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <p>No se encontraron delegados con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre Completo</th>
                  <th>Centro Educativo</th>
                  <th>Distrito</th>
                  <th>Comision / Pais</th>
                  <th>Check-In</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--silver)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                    <td style={{ color: 'var(--silver)', fontSize: '0.85rem' }}>{p.educational_center || '—'}</td>
                    <td>
                      {p.district_code
                        ? <span className="badge badge-info">{p.district_code}</span>
                        : <span style={{ color: 'var(--silver)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{p.commission_name || '—'}</div>
                      {p.country_assigned && <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{p.country_assigned}</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.check_in_status ? 'badge-success' : 'badge-warning'}`}>
                        {p.check_in_status ? 'Registrado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--silver)', fontSize: '0.78rem', fontFamily: 'IBM Plex Mono, monospace' }}>
                      {p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}