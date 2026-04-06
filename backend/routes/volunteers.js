const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/volunteers/register - Registro publico de voluntarios
router.post('/register', async (req, res) => {
  const { full_name, educational_center, age, email, phone, gender, district_id, role_type } = req.body;

  if (!full_name || !educational_center || !gender || !district_id) {
    return res.status(400).json({ error: 'Nombre, centro, genero y distrito son requeridos.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO volunteers (full_name, educational_center, age, email, phone, gender, district_id, role_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, educational_center, age || null, email || null, phone || null, gender, district_id, role_type || 'general']
    );

    res.status(201).json({ 
      message: 'Voluntario registrado exitosamente.', 
      id: result.insertId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registrando voluntario.' });
  }
});

// GET /api/volunteers - Lista (admin)
router.get('/', authenticate, async (req, res) => {
  const { district_id, role_type } = req.query;

  let query = `
    SELECT v.*, d.code as district_code, d.name as district_name,
           c.name as commission_name
    FROM volunteers v
    LEFT JOIN districts d ON v.district_id = d.id
    LEFT JOIN commissions c ON v.commission_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'district_admin') {
    query += ' AND v.district_id = ?';
    params.push(req.user.district_id);
  } else if (district_id) {
    query += ' AND v.district_id = ?';
    params.push(district_id);
  }

  if (role_type) { query += ' AND v.role_type = ?'; params.push(role_type); }
  query += ' ORDER BY v.full_name ASC';

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo voluntarios.' });
  }
});

// POST /api/volunteers/:id/checkin
router.post('/:id/checkin', async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.execute('SELECT * FROM volunteers WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Voluntario no encontrado.' });

    if (existing[0].check_in_status) {
      return res.status(400).json({ error: 'Este voluntario ya realizo su check-in.' });
    }

    await db.execute(
      'UPDATE volunteers SET check_in_status = 1, check_in_time = NOW() WHERE id = ?',
      [id]
    );

    res.json({ message: 'Check-in de voluntario realizado.', volunteer: existing[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error en check-in de voluntario.' });
  }
});

// PUT /api/volunteers/:id/assign-commission
router.put('/:id/assign-commission', authenticate, async (req, res) => {
  const { commission_id, role_type } = req.body;

  try {
    await db.execute(
      'UPDATE volunteers SET commission_id = ?, role_type = ? WHERE id = ?',
      [commission_id, role_type, req.params.id]
    );
    res.json({ message: 'Comision asignada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error asignando comision.' });
  }
});

// GET /api/volunteers/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    let filter = req.user.role === 'district_admin' ? `WHERE district_id = ${req.user.district_id}` : '';

    const [total] = await db.execute(`SELECT COUNT(*) as total FROM volunteers ${filter}`);
    const [staff] = await db.execute(`SELECT COUNT(*) as total FROM volunteers ${filter ? filter + " AND role_type = 'staff'" : "WHERE role_type = 'staff'"}`);
    const [mesa] = await db.execute(`SELECT COUNT(*) as total FROM volunteers ${filter ? filter + " AND role_type = 'mesa_directiva'" : "WHERE role_type = 'mesa_directiva'"}`);

    res.json({ total: total[0].total, staff: staff[0].total, mesa_directiva: mesa[0].total });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadisticas.' });
  }
});

module.exports = router;