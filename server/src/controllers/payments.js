// Test without PayPal service first
let paypal = null;
try {
  const PayPalService = require('../services/paypal');
  paypal = new PayPalService();
  console.log('✅ PayPal service initialized');
} catch (error) {
  console.error('❌ PayPal service initialization failed:', error.message);
}

// Create PayPal order
exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount, description, jobId, customerData } = req.body;

    if (!amount || !description || !customerData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, description, customerData'
      });
    }

    const orderData = {
      amount: parseFloat(amount),
      description,
      jobId: jobId || `JOB-${Date.now()}`,
      customerData
    };

    const order = await paypal.createOrder(orderData);

    res.json({
      success: true,
      orderId: order.orderId,
      approvalUrl: order.approvalUrl,
      status: order.status
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Capture PayPal payment
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const capture = await paypal.captureOrder(orderId);

    // Log the successful payment
    console.log('✅ PayPal payment captured:', capture);

    res.json({
      success: true,
      transactionId: capture.transactionId,
      captureId: capture.captureId,
      amount: capture.amount,
      currency: capture.currency,
      status: capture.status
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Stripe payment intent (existing)
exports.createPaymentIntent = async (req, res) => {
  res.json({ success: true, message: 'Stripe payment intent - implement with Stripe SDK' });
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { captureId, amount, currency = 'USD', note } = req.body;

    if (!captureId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Capture ID and amount are required'
      });
    }

    const refund = await paypal.refundPayment(captureId, amount, currency, note);

    res.json({
      success: true,
      refundId: refund.refundId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Payment webhook received:', event);

    // Handle different webhook events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Handle successful payment
        console.log('✅ Payment completed:', event.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        // Handle failed payment
        console.log('❌ Payment denied:', event.resource);
        break;
      default:
        console.log('Unhandled webhook event:', event.event_type);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    // In a real app, fetch from database
    const mockHistory = [
      {
        id: 'TXN-001',
        amount: 150.00,
        currency: 'USD',
        status: 'completed',
        method: 'paypal',
        date: new Date().toISOString(),
        description: 'Mobile Detailing Service'
      }
    ];

    res.json({ 
      success: true, 
      data: mockHistory 
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
