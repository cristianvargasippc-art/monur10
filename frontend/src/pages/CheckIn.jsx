import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({ district_id: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    api.get('/districts').then(r => setDistricts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/participants/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = (p) => {
    setSelected(p);
    setResults([]);
    setQuery(p.full_name);
    setForm({ district_id: p.district_id || '', phone: p.phone || '', email: p.email || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!form.district_id) { toast.error('Seleccione su distrito educativo.'); return; }

    setLoading(true);
    try {
      const res = await api.post('/participants/checkin', {
        participant_id: selected.id,
        district_id: form.district_id,
        phone: form.phone,
        email: form.email,
      });
      setSuccess(res.data.participant);
      setSelected(null);
      setQuery('');
      setForm({ district_id: '', phone: '', email: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al realizar check-in.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="checkin-page">
        <header className="checkin-header">
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--gold)' }}>MONUR-10</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--silver)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Check-In de Delegados</div>
        </header>

        <div className="checkin-container">
          <div className="card" style={{ textAlign: 'center', border: '1px solid rgba(26,122,74,0.4)', marginTop: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#4caf82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#4caf82', marginBottom: '0.5rem' }}>
              Check-In Exitoso
            </h2>
            <p style={{ color: 'var(--silver)', marginBottom: '1.5rem' }}>Bienvenido/a al MONUR-10</p>

            <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nombre</span>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--white)', marginTop: '0.15rem' }}>{success.full_name}</div>
              </div>
              {success.commission_name && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comision</span>
                  <div style={{ color: 'var(--gold-light)', marginTop: '0.15rem' }}>{success.commission_name}</div>
                </div>
              )}
              {success.country_assigned && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pais Asignado</span>
                  <div style={{ color: 'var(--white)', marginTop: '0.15rem' }}>{success.country_assigned}</div>
                </div>
              )}
              {success.district_name && (
                <div style={{ marginBottom: success.whatsapp_link ? '0.75rem' : 0 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Distrito</span>
                  <div style={{ color: 'var(--white)', marginTop: '0.15rem' }}>{success.district_name}</div>
                </div>
              )}
              {success.whatsapp_link && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grupo de WhatsApp</span>
                  <div style={{ marginTop: '0.4rem' }}>
                    <a href={success.whatsapp_link} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', padding: '0.4rem 0.9rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      Unirse al grupo de la comision
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSuccess(null)}>
              Realizar otro Check-In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <header className="checkin-header">
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--gold)' }}>MONUR-10</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--silver)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Modelo de Naciones Unidas Regional 10
        </div>
        <a href="/login" style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--silver)' }}>
          Acceso Administrativo
        </a>
      </header>

      <div className="checkin-container">
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--white)' }}>
            Check-In de Delegados
          </h2>
          <p style={{ color: 'var(--silver)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Busque su nombre, seleccionelo y complete su informacion para registrar su asistencia.
          </p>
        </div>

        <div className="card">
          {/* BUSCADOR */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Buscar su nombre</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Escriba su nombre completo..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                style={{ paddingRight: '2.5rem' }}
              />
              {searching && (
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--navy-mid)', border: '1px solid var(--border-strong)',
                borderRadius: '4px', marginTop: '4px', maxHeight: '260px', overflowY: 'auto',
                boxShadow: 'var(--shadow)',
              }}>
                {results.map(p => (
                  <div key={p.id} onClick={() => handleSelect(p)}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 500, color: p.check_in_status ? 'var(--silver)' : 'var(--white)' }}>
                      {p.full_name}
                      {p.check_in_status ? <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Ya registrado</span> : null}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--silver)', marginTop: '0.15rem' }}>
                      {p.educational_center && `${p.educational_center} · `}{p.commission_name || 'Sin comision asignada'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <>
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Seleccionado</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'var(--gold-light)' }}>{selected.full_name}</div>
                {selected.educational_center && <div style={{ fontSize: '0.8rem', color: 'var(--silver)', marginTop: '0.15rem' }}>{selected.educational_center}</div>}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Distrito Educativo</label>
                  <select value={form.district_id} onChange={e => setForm({ ...form, district_id: e.target.value })} required>
                    <option value="">Seleccione su distrito...</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Numero de Telefono</label>
                    <input type="tel" placeholder="809-000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Correo Electronico</label>
                    <input type="email" placeholder="ejemplo@correo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Registrando...</> : 'Confirmar Check-In'}
                </button>
              </form>
            </>
          )}

          {!selected && query.length < 2 && (
            <div className="empty-state" style={{ padding: '1.5rem 0 0.5rem' }}>
              <p>Escriba al menos 2 letras de su nombre para buscar.</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/volunteer-register" style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>
            Soy voluntario — Registrarme aquí
          </a>
        </div>
      </div>
    </div>
  );
}