const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments');
const auth = require('../middleware/auth');

// PayPal routes
router.post('/paypal/create-order', paymentsController.createPayPalOrder);
router.post('/paypal/capture', paymentsController.capturePayPalPayment);
router.post('/paypal/refund', auth.optional, paymentsController.refundPayment);

// Stripe routes
router.post('/stripe/create-intent', paymentsController.createPaymentIntent);

// General routes
router.post('/webhook', paymentsController.handleWebhook);
router.get('/history', auth.optional, paymentsController.getPaymentHistory);

module.exports = router;
