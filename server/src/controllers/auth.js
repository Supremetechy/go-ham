// Auth Controller (Simplified - Add JWT logic later)
exports.register = async (req, res) => {
  res.json({ success: true, message: 'Registration endpoint - implement with JWT' });
};

exports.login = async (req, res) => {
  res.json({ success: true, message: 'Login endpoint - implement with JWT', token: 'mock_token' });
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: { id: 1, email: 'admin@gohampro.com', role: 'admin' } });
};
