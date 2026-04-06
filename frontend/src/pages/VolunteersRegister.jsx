import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VolunteerRegister() {
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({
    full_name: '', educational_center: '', age: '', email: '', phone: '',
    gender: '', district_id: '', role_type: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/districts').then(r => setDistricts(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.educational_center || !form.gender || !form.district_id) {
      toast.error('Por favor complete todos los campos requeridos.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/volunteers/register', form);
      setSuccess(true);
      setForm({ full_name: '', educational_center: '', age: '', email: '', phone: '', gender: '', district_id: '', role_type: 'general' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar voluntario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkin-page">
      <header className="checkin-header">
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--gold)' }}>MONUR-10</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--silver)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Registro de Voluntarios
        </div>
        <a href="/login" style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--silver)' }}>Panel Admin</a>
      </header>

      <div className="checkin-container">
        {success ? (
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem', border: '1px solid rgba(26,122,74,0.4)' }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#4caf82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#4caf82', marginBottom: '0.5rem' }}>Registro Exitoso</h2>
            <p style={{ color: 'var(--silver)', marginBottom: '1.5rem' }}>
              Tu informacion ha sido recibida. El equipo del MONUR-10 se comunicara contigo pronto.
            </p>
            <button className="btn btn-secondary" onClick={() => setSuccess(false)}>Registrar otro voluntario</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--white)' }}>
                Formulario de Voluntarios
              </h2>
              <p style={{ color: 'var(--silver)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                Completa tu informacion para unirte como voluntario del MONUR-10.
              </p>
            </div>

            <div className="card">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Tu nombre completo" required />
                </div>

                <div className="form-group">
                  <label>Centro Educativo o Universidad *</label>
                  <input type="text" name="educational_center" value={form.educational_center} onChange={handleChange} placeholder="Nombre de tu centro educativo" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Edad</label>
                    <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="Tu edad" min="14" max="35" />
                  </div>
                  <div className="form-group">
                    <label>Genero *</label>
                    <select name="gender" value={form.gender} onChange={handleChange} required>
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Prefiero no indicar</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Correo Electronico</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" />
                  </div>
                  <div className="form-group">
                    <label>Numero de Telefono</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="809-000-0000" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Distrito Educativo *</label>
                    <select name="district_id" value={form.district_id} onChange={handleChange} required>
                      <option value="">Seleccione su distrito...</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Participacion</label>
                    <select name="role_type" value={form.role_type} onChange={handleChange}>
                      <option value="general">Voluntario General</option>
                      <option value="staff">Staff del Modelo</option>
                      <option value="mesa_directiva">Mesa Directiva</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }} disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Registrando...</> : 'Enviar Registro'}
                </button>
              </form>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/checkin" style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>
            Soy delegado — Ir al Check-In
          </a>
        </div>
      </div>
    </div>
  );
}