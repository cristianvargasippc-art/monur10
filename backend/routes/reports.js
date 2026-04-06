const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safe}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF.'), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

// POST /api/reports/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo PDF requerido.' });

  const { report_type, title, notes } = req.body;

  if (!report_type || !title) {
    return res.status(400).json({ error: 'Tipo de informe y titulo son requeridos.' });
  }

  const validTypes = [
    'logistics_report',
    'tentative_agenda',
    'final_model_report',
    'delegations_approved',
  ];
  if (!validTypes.includes(report_type)) {
    return res.status(400).json({ error: 'Tipo de informe no valido.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO reports (district_id, user_id, report_type, title, file_path, file_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.district_id,
        req.user.id,
        report_type,
        title,
        `uploads/reports/${req.file.filename}`,
        req.file.originalname,
        notes || null
      ]
    );

    res.status(201).json({ 
      message: 'Informe subido correctamente.', 
      id: result.insertId,
      file_name: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando informe.' });
  }
});

// GET /api/reports
router.get('/', authenticate, async (req, res) => {
  const { district_id, report_type } = req.query;

  let query = `
    SELECT r.*, d.code as district_code, d.name as district_name,
           u.full_name as submitted_by
    FROM reports r
    LEFT JOIN districts d ON r.district_id = d.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'district_admin') {
    query += ' AND r.district_id = ?';
    params.push(req.user.district_id);
  } else if (district_id) {
    query += ' AND r.district_id = ?';
    params.push(district_id);
  }

  if (report_type) { query += ' AND r.report_type = ?'; params.push(report_type); }
  query += ' ORDER BY r.submitted_at DESC';

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo informes.' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Informe no encontrado.' });

    const report = rows[0];
    if (req.user.role === 'district_admin' && report.district_id !== req.user.district_id) {
      return res.status(403).json({ error: 'Sin permiso para eliminar este informe.' });
    }

    const filePath = path.join(__dirname, '..', '..', report.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ message: 'Informe eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando informe.' });
  }
});

module.exports = router;