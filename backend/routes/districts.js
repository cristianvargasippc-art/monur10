// routes/districts.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM districts ORDER BY code ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo distritos.' });
  }
});

module.exports = router;