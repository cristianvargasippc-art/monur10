const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT u.*, d.code as district_code, d.name as district_name 
       FROM users u 
       LEFT JOIN districts d ON u.district_id = d.id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        district_id: user.district_id,
        district_code: user.district_code,
        district_name: user.district_name,
        full_name: user.full_name
      },
      process.env.JWT_SECRET || 'monur10_secret_key_2025',
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        district_id: user.district_id,
        district_code: user.district_code,
        district_name: user.district_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contrasena actual incorrecta.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Contrasena actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando contrasena.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.last_login,
              d.code as district_code, d.name as district_name
       FROM users u LEFT JOIN districts d ON u.district_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo perfil.' });
  }
});

module.exports = router;