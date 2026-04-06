// routes/checkin.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/checkin/stats - Estadisticas globales del modelo
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [pTotal] = await db.execute('SELECT COUNT(*) as total FROM participants');
    const [pChecked] = await db.execute('SELECT COUNT(*) as total FROM participants WHERE check_in_status = 1');
    const [vTotal] = await db.execute('SELECT COUNT(*) as total FROM volunteers');
    const [vChecked] = await db.execute('SELECT COUNT(*) as total FROM volunteers WHERE check_in_status = 1');

    const [byDistrict] = await db.execute(`
      SELECT d.code, d.name, 
             COUNT(p.id) as total_participants,
             SUM(p.check_in_status) as checked_in
      FROM districts d
      LEFT JOIN participants p ON p.district_id = d.id
      GROUP BY d.id ORDER BY d.code
    `);

    res.json({
      participants: { total: pTotal[0].total, checked_in: pChecked[0].total },
      volunteers: { total: vTotal[0].total, checked_in: vChecked[0].total },
      by_district: byDistrict
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en estadisticas.' });
  }
});

module.exports = router;