// Notifications Controller
exports.sendEmail = async (req, res) => {
  res.json({ success: true, message: 'Email sent - implement with SendGrid' });
};

exports.sendSMS = async (req, res) => {
  res.json({ success: true, message: 'SMS sent - implement with Twilio' });
};

exports.alertWorkers = async (req, res) => {
  res.json({ success: true, message: 'Workers alerted' });
};
