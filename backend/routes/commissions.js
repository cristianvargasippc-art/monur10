const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireSGA } = require('../middleware/auth');

// GET /api/commissions
router.get('/', async (req, res) => {
  const { district_id } = req.query;
  let query = `
    SELECT c.*, d.code as district_code, d.name as district_name,
           COUNT(p.id) as delegate_count
    FROM commissions c
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN participants p ON p.commission_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (district_id) { query += ' AND c.district_id = ?'; params.push(district_id); }
  query += ' GROUP BY c.id ORDER BY c.name ASC';

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo comisiones.' });
  }
});

// POST /api/commissions - Crear comision
router.post('/', authenticate, async (req, res) => {
  const { name, country_assigned, max_delegates, whatsapp_link, district_id } = req.body;

  if (!name) return res.status(400).json({ error: 'Nombre de comision requerido.' });

  try {
    const [result] = await db.execute(
      `INSERT INTO commissions (name, country_assigned, max_delegates, whatsapp_link, district_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, country_assigned || null, max_delegates || 20, whatsapp_link || null, district_id || req.user.district_id]
    );
    res.status(201).json({ message: 'Comision creada.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error creando comision.' });
  }
});

// PUT /api/commissions/:id
router.put('/:id', authenticate, async (req, res) => {
  const { name, country_assigned, max_delegates, whatsapp_link } = req.body;

  try {
    await db.execute(
      `UPDATE commissions SET name = ?, country_assigned = ?, max_delegates = ?, whatsapp_link = ?
       WHERE id = ?`,
      [name, country_assigned, max_delegates, whatsapp_link, req.params.id]
    );
    res.json({ message: 'Comision actualizada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando comision.' });
  }
});

// POST /api/commissions/assign-countries - Asignar paises automaticamente
router.post('/assign-countries', authenticate, requireSGA, async (req, res) => {
  const { countries } = req.body; // array de strings

  try {
    const [commissions] = await db.execute('SELECT id FROM commissions ORDER BY id ASC');

    for (let i = 0; i < commissions.length; i++) {
      const country = countries[i % countries.length];
      await db.execute('UPDATE commissions SET country_assigned = ? WHERE id = ?', [country, commissions[i].id]);
    }

    res.json({ message: 'Paises asignados equitativamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error asignando paises.' });
  }
});

module.exports = router;