import React, { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ImportExcel() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleImport = async () => {
    if (!file) { toast.error('Seleccione un archivo Excel.'); return; }
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/participants/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      toast.success(res.data.message);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Importar Delegados desde Excel</h2>
        <div className="gold-line" />
        <p>Suba un archivo Excel con el listado de delegados para registrarlos masivamente en el sistema.</p>
      </div>

      {/* INSTRUCCIONES */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">Formato del Archivo Excel</div>
        </div>
        <p style={{ color: 'var(--silver)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          El archivo debe tener las siguientes columnas en la primera fila (exactamente como se muestra):
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Columna</th>
                <th>Nombre requerido</th>
                <th>Descripcion</th>
                <th>Obligatorio</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['A', 'NOMBRE COMPLETO', 'Nombre completo del delegado', 'Si'],
                ['B', 'CENTRO EDUCATIVO', 'Centro educativo al que pertenece', 'No'],
                ['C', 'DISTRITO', 'Codigo del distrito (ej: 10-01)', 'No'],
                ['D', 'COMISION', 'Nombre de la comision asignada', 'No'],
                ['E', 'PAIS', 'Pais asignado al delegado', 'No'],
              ].map(([col, name, desc, req]) => (
                <tr key={col}>
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--gold)' }}>{col}</td>
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem' }}>{name}</td>
                  <td style={{ color: 'var(--silver)', fontSize: '0.85rem' }}>{desc}</td>
                  <td>
                    <span className={`badge ${req === 'Si' ? 'badge-warning' : 'badge-info'}`}>{req}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBIDA */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">Cargar Archivo</div>
        </div>

        <div
          className="file-upload-area"
          onClick={() => fileRef.current.click()}
          style={{ marginBottom: '1.25rem' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          {file ? (
            <div style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{file.name}</div>
          ) : (
            <div style={{ color: 'var(--silver)' }}>Haga clic para seleccionar archivo .xlsx o .xls</div>
          )}
          <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Formatos aceptados: .xlsx, .xls'}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0]); setResult(null); }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!file || importing}
          style={{ minWidth: '180px', justifyContent: 'center' }}
        >
          {importing ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Importando...</> : 'Importar Delegados'}
        </button>
      </div>

      {/* RESULTADO */}
      {result && (
        <div className={`alert ${result.imported > 0 ? 'alert-success' : 'alert-warning'}`}>
          <strong>{result.message}</strong>
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>Advertencias ({result.errors.length}):</div>
              {result.errors.slice(0, 5).map((e, i) => <div key={i}>- {e}</div>)}
              {result.errors.length > 5 && <div>... y {result.errors.length - 5} mas.</div>}
            </div>
          )}
        </div>
      )}

      {/* INFO ADICIONAL */}
      <div className="card" style={{ background: 'rgba(201,168,76,0.04)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--silver)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--gold-light)', display: 'block', marginBottom: '0.5rem' }}>Notas importantes:</strong>
          El sistema asignara automaticamente los paises a los delegados si se especifica la columna COMISION y la comision tiene un pais asignado. Los delegados importados apareceran en la lista de check-in inmediatamente. Puede realizar multiples importaciones; los registros se acumulan sin eliminar los existentes.
        </div>
      </div>
    </div>
  );
}