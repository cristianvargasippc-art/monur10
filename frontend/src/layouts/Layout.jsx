import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>MONUR-10</h1>
          <p>Sistema de Gestion</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Operaciones</div>
            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Tablero
            </Link>
            <Link to="/participants" className={`nav-item ${isActive('/participants')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Delegados
            </Link>
            <Link to="/volunteers" className={`nav-item ${isActive('/volunteers')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5m0 0l9 5m-9-5v10l9 5m0-5l9-5m-9 5v10l-9-5"/>
              </svg>
              Voluntarios
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Administracion</div>
            <Link to="/commissions" className={`nav-item ${isActive('/commissions')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Comisiones
            </Link>
            <Link to="/reports" className={`nav-item ${isActive('/reports')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Informes
            </Link>
            <Link to="/import" className={`nav-item ${isActive('/import')}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Importar Excel
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          {userData && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="user-name">{userData.full_name || 'Usuario'}</div>
              <div className="user-role">{userData.role === 'sga_regional' ? 'Coordinador' : 'Administrador'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--silver)', marginTop: '0.3rem' }}>{userData.district_code || 'Regional'}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.65rem 1.25rem',
              background: 'transparent',
              color: 'var(--silver)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = 'var(--gold)';
              e.target.style.color = 'var(--white)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.color = 'var(--silver)';
            }}
          >
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">MONUR-10</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--silver)' }}>
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}