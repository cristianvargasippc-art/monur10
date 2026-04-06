import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import CheckIn from './pages/CheckIn';
import VolunteerRegister from './pages/VolunteersRegister';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Volunteers from './pages/Volunteers';
import Reports from './pages/Reports';
import Commissions from './pages/Commissions';
import ImportExcel from './pages/ImportExcel';
import Layout from './layouts/Layout';

// 🔐 Ruta protegida usando AuthContext (NO localStorage directo)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ⏳ Esperar a que cargue el contexto
  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { loading } = useAuth();

  // evita render antes de cargar auth
  if (loading) {
    return <div style={{ padding: 20 }}>Inicializando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/volunteer-register" element={<VolunteerRegister />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="participants" element={<Participants />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="import" element={<ImportExcel />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;