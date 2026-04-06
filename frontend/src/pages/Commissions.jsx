import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Commissions() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', country_assigned: '', max_delegates: 20, whatsapp_link: '', district_id: '' });
  const [districts, setDistricts] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([api.get('/commissions'), api.get('/districts')]);
      setCommissions(cRes.data);
      setDistricts(dRes.data);
    } catch { toast.error('Error cargando comisiones.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ name: '', country_assigned: '', max_delegates: 20, whatsapp_link: '', district_id: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, country_assigned: c.country_assigned || '', max_delegates: c.max_delegates, whatsapp_link: c.whatsapp_link || '', district_id: c.district_id || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/commissions/${editItem.id}`, form);
        toast.success('Comision actualizada.');
      } else {
        await api.post('/commissions', form);
        toast.success('Comision creada.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Comisiones</h2>
          <div className="gold-line" />
          <p>Administre las comisiones, paises asignados y grupos de WhatsApp.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>Nueva Comision</button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Comisiones del Modelo</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>{commissions.length} comisiones</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Cargando...</div>
        ) : commissions.length === 0 ? (
          <div className="empty-state"><p>No hay comisiones registradas.</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre de Comision</th>
                  <th>Pais Asignado</th>
                  <th>Distrito</th>
                  <th>Max Delegados</th>
                  <th>Delegados Actuales</th>
                  <th>WhatsApp</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ color: 'var(--gold)' }}>{c.country_assigned || '—'}</td>
                    <td>{c.district_code ? <span className="badge badge-info">{c.district_code}</span> : '—'}</td>
                    <td style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.max_delegates}</td>
                    <td>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: c.delegate_count > c.max_delegates ? '#e74c3c' : 'var(--white)' }}>
                        {c.delegate_count}
                      </span>
                    </td>
                    <td>
                      {c.whatsapp_link
                        ? <a href={c.whatsapp_link} target="_blank" rel="noreferrer" style={{ color: '#25d366', fontSize: '0.8rem' }}>Ver enlace</a>
                        : <span style={{ color: 'var(--silver)', fontSize: '0.8rem' }}>Sin enlace</span>}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Editar Comision' : 'Nueva Comision'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Comision *</label>
                <input type="text" placeholder="Ej: Consejo de Seguridad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pais Asignado</label>
                  <input type="text" placeholder="Ej: Brasil" value={form.country_assigned} onChange={e => setForm({ ...form, country_assigned: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Maximo de Delegados</label>
                  <input type="number" min="1" max="200" value={form.max_delegates} onChange={e => setForm({ ...form, max_delegates: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Enlace de WhatsApp</label>
                <input type="url" placeholder="https://chat.whatsapp.com/..." value={form.whatsapp_link} onChange={e => setForm({ ...form, whatsapp_link: e.target.value })} />
              </div>
              {user?.role === 'sga_regional' && (
                <div className="form-group">
                  <label>Distrito Asignado</label>
                  <select value={form.district_id} onChange={e => setForm({ ...form, district_id: e.target.value })}>
                    <option value="">Sin distrito especifico</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Guardar Cambios' : 'Crear Comision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}