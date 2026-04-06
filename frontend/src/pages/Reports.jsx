import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const REPORT_TYPES = [
  { value: 'logistics_agenda', label: 'Logistica y Agenda Tentativa', description: 'Informe de logistica del modelo y agenda de celebracion.' },
  { value: 'post_event', label: 'Informe Post-Evento', description: 'Resumen de como se realizo el modelo, resultados y observaciones.' },
  { value: 'delegations', label: 'Delegaciones por Comision', description: 'PDF con las delegaciones que pasaron en cada comision.' },
];

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ report_type: '', title: '', notes: '' });
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch { toast.error('Error cargando informes.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Seleccione un archivo PDF.'); return; }
    if (!form.report_type || !form.title) { toast.error('Complete tipo y titulo del informe.'); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('report_type', form.report_type);
    fd.append('title', form.title);
    fd.append('notes', form.notes);

    try {
      await api.post('/reports/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Informe subido correctamente.');
      setShowModal(false);
      setForm({ report_type: '', title: '', notes: '' });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir informe.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este informe? Esta accion no se puede deshacer.')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Informe eliminado.');
      load();
    } catch { toast.error('Error al eliminar.'); }
  };

  const typeLabel = (t) => REPORT_TYPES.find(r => r.value === t)?.label || t;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Informes PDF</h2>
          <div className="gold-line" />
          <p>Gestion de documentos oficiales del modelo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Subir Nuevo Informe
        </button>
      </div>

      {/* TIPOS DE INFORMES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {REPORT_TYPES.map(rt => {
          const count = reports.filter(r => r.report_type === rt.value).length;
          return (
            <div key={rt.value} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: 'var(--white)', marginBottom: '0.25rem' }}>{rt.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--silver)', marginBottom: '0.5rem' }}>{rt.description}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '1.4rem', color: 'var(--gold-light)' }}>{count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>documentos</div>
            </div>
          );
        })}
      </div>

      {/* TABLA */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Todos los Informes</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>{reports.length} documentos</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Cargando...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <p>No hay informes subidos todavia.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Tipo</th>
                  <th>Distrito</th>
                  <th>Subido por</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.title}</div>
                      {r.notes && <div style={{ fontSize: '0.78rem', color: 'var(--silver)', marginTop: '0.15rem' }}>{r.notes}</div>}
                    </td>
                    <td><span className="badge badge-info">{typeLabel(r.report_type)}</span></td>
                    <td>{r.district_code ? <span className="badge badge-warning">{r.district_code}</span> : '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--silver)' }}>{r.submitted_by}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--silver)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      {new Date(r.submitted_at).toLocaleDateString('es-DO')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={`http://localhost:3001${r.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          Ver PDF
                        </a>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SUBIR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Subir Nuevo Informe</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Tipo de Informe *</label>
                <select value={form.report_type} onChange={e => setForm({ ...form, report_type: e.target.value })} required>
                  <option value="">Seleccione el tipo...</option>
                  {REPORT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Titulo del Documento *</label>
                <input type="text" placeholder="Ej: Agenda MONUR-10 Distrito 10-01" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Notas adicionales (opcional)</label>
                <textarea rows="2" placeholder="Observaciones sobre este documento..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Archivo PDF *</label>
                <div
                  className="file-upload-area"
                  onClick={() => fileRef.current.click()}
                >
                  <div style={{ color: 'var(--gold-light)', marginBottom: '0.25rem' }}>
                    {file ? file.name : 'Haga clic para seleccionar archivo PDF'}
                  </div>
                  <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Maximo 20 MB'}</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Subir Informe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}