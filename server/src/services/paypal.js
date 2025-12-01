const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

class PayPalService {
  constructor() {
    // PayPal environment configuration
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.NODE_ENV === 'production' 
      ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
    
    this.client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  }

  async createOrder(orderData) {
    const { amount, currency = 'USD', description, jobId, customerData } = orderData;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      application_context: {
        return_url: `${process.env.CLIENT_URL}/payment-success`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
        brand_name: 'GO HAM PRO',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      },
      purchase_units: [{
        reference_id: jobId,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        description: description,
        custom_id: jobId,
        invoice_id: `GOHAM-${jobId}-${Date.now()}`,
        soft_descriptor: 'GOHAM PRO'
      }],
      payer: {
        name: {
          given_name: customerData.firstName || '',
          surname: customerData.lastName || ''
        },
        email_address: customerData.email,
        phone: {
          phone_type: 'MOBILE',
          phone_number: {
            national_number: customerData.phone
          }
        }
      }
    });

    try {
      const order = await this.client.execute(request);
      return {
        success: true,
        orderId: order.result.id,
        status: order.result.status,
        links: order.result.links,
        approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
      };
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  async captureOrder(orderId) {
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await this.client.execute(request);
      const captureData = capture.result;

      return {
        success: true,
        transactionId: captureData.id,
        status: captureData.status,
        amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
        currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
        payerId: captureData.payer.payer_id,
        captureId: captureData.purchase_units[0].payments.captures[0].id,
        createTime: captureData.create_time,
        updateTime: captureData.update_time
      };
    } catch (error) {
      console.error('PayPal capture error:', error);
      throw new Error(`PayPal capture failed: ${error.message}`);
    }
  }

  async refundPayment(captureId, amount, currency = 'USD', note) {
    const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId);
    request.requestBody({
      amount: {
        value: amount.toFixed(2),
        currency_code: currency
      },
      note_to_payer: note
    });

    try {
      const refund = await this.client.execute(request);
      return {
        success: true,
        refundId: refund.result.id,
        status: refund.result.status,
        amount: parseFloat(refund.result.amount.value),
        currency: refund.result.amount.currency_code
      };
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw new Error(`PayPal refund failed: ${error.message}`);
    }
  }

  async getOrderDetails(orderId) {
    const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

    try {
      const order = await this.client.execute(request);
      return {
        success: true,
        order: order.result
      };
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error(`Failed to get PayPal order: ${error.message}`);
    }
  }
}

module.exports = PayPalService;