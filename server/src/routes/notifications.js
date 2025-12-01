const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications');
const auth = require('../middleware/auth');

router.post('/email', auth.required, notificationsController.sendEmail);
router.post('/sms', auth.required, notificationsController.sendSMS);
router.post('/alert-workers', notificationsController.alertWorkers);

module.exports = router;
