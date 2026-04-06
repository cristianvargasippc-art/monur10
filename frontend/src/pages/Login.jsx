import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');

  if (!username || !password) {
    const msg = 'Complete usuario y contraseña.';
    setErrorMessage(msg);
    toast.error(msg);
    return;
  }

  setLoading(true);

  try {
    await login(username, password);
    toast.success('Sesion iniciada correctamente.');
    navigate('/dashboard');
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al iniciar sesion.';
    setErrorMessage(msg);
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060f1e 0%, #0d1f3c 50%, #0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            MONUR-10
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sistema de Gestion
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.7rem 0.8rem',
                border: '1px solid rgba(231,76,60,0.45)',
                borderRadius: '6px',
                background: 'rgba(231,76,60,0.08)',
                color: '#ffb3ab',
                fontSize: '0.82rem',
              }}
            >
              {errorMessage}
            </div>
          )}
          <div className="form-group">
            <label>Usuario</label>
            <input type="text" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1.5rem' }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Iniciando...</> : 'Iniciar Sesion'}
          </button>
        </form>

        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', fontSize: '0.8rem', color: 'var(--silver)' }}>
          <div style={{ fontWeight: 500, color: 'var(--gold-light)', marginBottom: '0.5rem' }}>Credenciales de Prueba:</div>
          <div><strong>Usuario:</strong> sga_regional</div>
          <div><strong>Contraseña:</strong> monur10_sga</div>
        </div>
      </div>
    </div>
  );
}