import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Volunteers() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role_type: '', search: '' });
  const [checkingIn, setCheckingIn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.role_type) params.set('role_type', filter.role_type);
      const res = await api.get(`/volunteers?${params}`);
      setVolunteers(res.data);
    } catch { toast.error('Error cargando voluntarios.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter.role_type]);

  const handleCheckIn = async (id) => {
    setCheckingIn(id);
    try {
      await api.post(`/volunteers/${id}/checkin`);
      toast.success('Check-in de voluntario registrado.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error en check-in.');
    } finally {
      setCheckingIn(null);
    }
  };

  const filtered = volunteers.filter(v =>
    !filter.search || v.full_name.toLowerCase().includes(filter.search.toLowerCase())
  );

  const roleLabels = { staff: 'Staff', mesa_directiva: 'Mesa Directiva', general: 'General' };

  return (
    <div>
      <div className="page-header">
        <h2>Voluntarios</h2>
        <div className="gold-line" />
        <p>
          Gestion de voluntarios del modelo —{' '}
          {user?.role === 'district_admin' ? `Distrito ${user.district_code}` : 'Todos los distritos'}.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
            <label>Buscar por nombre</label>
            <input type="text" placeholder="Filtrar voluntarios..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '160px', marginBottom: 0 }}>
            <label>Tipo de Rol</label>
            <select value={filter.role_type} onChange={e => setFilter({ ...filter, role_type: e.target.value })}>
              <option value="">Todos los roles</option>
              <option value="staff">Staff</option>
              <option value="mesa_directiva">Mesa Directiva</option>
              <option value="general">General</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={load} style={{ marginBottom: 0 }}>Actualizar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Registro de Voluntarios</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>{filtered.length} voluntarios</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <p>No hay voluntarios registrados con este filtro.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Centro Educativo</th>
                  <th>Distrito</th>
                  <th>Genero</th>
                  <th>Rol</th>
                  <th>Contacto</th>
                  <th>Check-In</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.full_name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--silver)' }}>{v.educational_center}</td>
                    <td>
                      {v.district_code
                        ? <span className="badge badge-info">{v.district_code}</span>
                        : '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{v.gender}</td>
                    <td>
                      <span className={`badge ${v.role_type === 'staff' ? 'badge-warning' : v.role_type === 'mesa_directiva' ? 'badge-info' : 'badge-info'}`}>
                        {roleLabels[v.role_type] || v.role_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--silver)' }}>
                      {v.phone && <div>{v.phone}</div>}
                      {v.email && <div>{v.email}</div>}
                      {!v.phone && !v.email && '—'}
                    </td>
                    <td>
                      <span className={`badge ${v.check_in_status ? 'badge-success' : 'badge-warning'}`}>
                        {v.check_in_status ? 'Presente' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      {!v.check_in_status && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCheckIn(v.id)}
                          disabled={checkingIn === v.id}
                        >
                          {checkingIn === v.id ? '...' : 'Check-In'}
                        </button>
                      )}
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