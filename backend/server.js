const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const participantsRoutes = require('./routes/participants');
const volunteersRoutes = require('./routes/volunteers');
const reportsRoutes = require('./routes/reports');
const commissionsRoutes = require('./routes/commissions');
const districtsRoutes = require('./routes/districts');
const checkInRoutes = require('./routes/checkin');

const app = express();

/* =========================
   SEGURIDAD
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

/* =========================
   CORS (FIX COMPLETO)
========================= */
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000', // Create React App
  'http://localhost:5173', // Vite
  ...envOrigins,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // permitir requests sin origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARES
========================= */
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* =========================
   ARCHIVOS ESTÁTICOS
========================= */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* =========================
   RUTAS API
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/checkin', checkInRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'MONUR-10 API Running',
    timestamp: new Date()
  });
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

/* =========================
   ERROR HANDLER GLOBAL
========================= */
app.use((err, req, res, next) => {
  console.error('ERROR:', err.stack);

  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MONUR-10 Backend corriendo en puerto ${PORT}`);
  console.log('Orígenes permitidos:', allowedOrigins);
});