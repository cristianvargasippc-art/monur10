const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'monur10_secret_key_2025');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalido o expirado.' });
  }
};

const requireSGA = (req, res, next) => {
  if (req.user.role !== 'sga_regional') {
    return res.status(403).json({ error: 'Acceso restringido al SGA Regional.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!['sga_regional', 'district_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};

module.exports = { authenticate, requireSGA, requireAdmin };