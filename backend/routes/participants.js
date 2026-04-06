const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/participants/search?q=nombre
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.full_name, p.educational_center, p.check_in_status,
              d.code as district_code, d.name as district_name,
              c.name as commission_name, c.country_assigned
       FROM participants p
       LEFT JOIN districts d ON p.district_id = d.id
       LEFT JOIN commissions c ON p.commission_id = c.id
       WHERE p.full_name LIKE ? 
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en busqueda.' });
  }
});

// POST /api/participants/checkin - Check-in publico
router.post('/checkin', async (req, res) => {
  const { participant_id, district_id, phone, email } = req.body;

  if (!participant_id) {
    return res.status(400).json({ error: 'Participante requerido.' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT * FROM participants WHERE id = ?', [participant_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Participante no encontrado.' });
    }

    if (existing[0].check_in_status) {
      return res.status(400).json({ 
        error: 'Este participante ya realizo su check-in.',
        participant: existing[0]
      });
    }

    await db.execute(
      `UPDATE participants SET 
        check_in_status = 1, 
        check_in_time = NOW(),
        district_id = COALESCE(?, district_id),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email)
       WHERE id = ?`,
      [district_id || null, phone || null, email || null, participant_id]
    );

    const [updated] = await db.execute(
      `SELECT p.*, d.name as district_name, c.name as commission_name, 
              c.country_assigned, c.whatsapp_link
       FROM participants p
       LEFT JOIN districts d ON p.district_id = d.id
       LEFT JOIN commissions c ON p.commission_id = c.id
       WHERE p.id = ?`,
      [participant_id]
    );

    res.json({ 
      message: 'Check-in realizado exitosamente.', 
      participant: updated[0] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en check-in.' });
  }
});

// GET /api/participants - Lista de participantes (admin)
router.get('/', authenticate, async (req, res) => {
  const { district_id, commission_id, check_in } = req.query;

  let query = `
    SELECT p.*, d.code as district_code, d.name as district_name,
           c.name as commission_name, c.country_assigned
    FROM participants p
    LEFT JOIN districts d ON p.district_id = d.id
    LEFT JOIN commissions c ON p.commission_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'district_admin') {
    query += ' AND p.district_id = ?';
    params.push(req.user.district_id);
  } else if (district_id) {
    query += ' AND p.district_id = ?';
    params.push(district_id);
  }

  if (commission_id) { query += ' AND p.commission_id = ?'; params.push(commission_id); }
  if (check_in !== undefined) { query += ' AND p.check_in_status = ?'; params.push(check_in); }

  query += ' ORDER BY p.full_name ASC';

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo participantes.' });
  }
});

// POST /api/participants/import - Importar desde Excel
router.post('/import', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo Excel requerido.' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel esta vacio.' });
    }

    const batch = `IMPORT_${Date.now()}`;
    let imported = 0;
    const errors = [];

    for (const row of data) {
      const fullName = row['NOMBRE COMPLETO'] || row['nombre_completo'] || row['Nombre Completo'];
      const center = row['CENTRO EDUCATIVO'] || row['centro_educativo'] || row['Centro Educativo'];
      const districtCode = row['DISTRITO'] || row['distrito'];
      const commission = row['COMISION'] || row['comision'] || row['Comision'];
      const country = row['PAIS'] || row['pais'] || row['Pais'];

      if (!fullName) { errors.push(`Fila sin nombre: ${JSON.stringify(row)}`); continue; }

      let districtId = req.user.district_id;
      if (districtCode) {
        const [dist] = await db.execute('SELECT id FROM districts WHERE code = ?', [districtCode]);
        if (dist.length > 0) districtId = dist[0].id;
      }

      let commissionId = null;
      if (commission) {
        const [comm] = await db.execute('SELECT id FROM commissions WHERE name LIKE ?', [`%${commission}%`]);
        if (comm.length > 0) commissionId = comm[0].id;
      }

      await db.execute(
        `INSERT INTO participants (full_name, educational_center, district_id, commission_id, country_assigned, imported_batch)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [fullName, center || null, districtId, commissionId, country || null, batch]
      );
      imported++;
    }

    await db.execute(
      `INSERT INTO excel_imports (district_id, user_id, import_type, file_name, records_imported)
       VALUES (?, ?, 'delegates', ?, ?)`,
      [req.user.district_id, req.user.id, req.file.originalname, imported]
    );

    res.json({ 
      message: `${imported} delegados importados correctamente.`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando archivo Excel.' });
  }
});

// GET /api/participants/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    let districtFilter = '';
    const params = [];

    if (req.user.role === 'district_admin') {
      districtFilter = 'WHERE district_id = ?';
      params.push(req.user.district_id);
    }

    const [total] = await db.execute(`SELECT COUNT(*) as total FROM participants ${districtFilter}`, params);
    const [checkedIn] = await db.execute(`SELECT COUNT(*) as total FROM participants ${districtFilter ? districtFilter + ' AND check_in_status = 1' : 'WHERE check_in_status = 1'}`, params);

    res.json({
      total: total[0].total,
      checked_in: checkedIn[0].total,
      pending: total[0].total - checkedIn[0].total
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadisticas.' });
  }
});

module.exports = router;