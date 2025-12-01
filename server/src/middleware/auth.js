// Authentication Middleware (Simplified)
exports.required = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  // TODO: Verify JWT token
  req.user = { id: 1, role: 'admin' };
  next();
};

exports.optional = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // TODO: Verify JWT token
    req.user = { id: 1, role: 'admin' };
  }
  next();
};
