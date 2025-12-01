import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { apiClient } from '../api';

const PayPalCheckout = ({ 
  amount, 
  description, 
  customerData, 
  onSuccess, 
  onError, 
  onCancel,
  jobId 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const paypalOptions = {
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "AYiMTDaWZZap7kUJbWU3QPQhr3MG8JA9QSVbOl-TG3xjKLJqzMfaP2vqJWK3BM_axOKdRDwjlbEVqoSE",
    currency: "USD",
    intent: "capture",
    "enable-funding": "venmo,paylater",
    "disable-funding": "card",
    "data-sdk-integration-source": "integrationbuilder_ac"
  };

  const createOrder = async (data, actions) => {
    try {
      setLoading(true);
      setError(null);

      // Create order on our backend
      const response = await apiClient.post('/api/payments/paypal/create-order', {
        amount: parseFloat(amount),
        description,
        jobId,
        customerData: {
          firstName: customerData.name?.split(' ')[0] || '',
          lastName: customerData.name?.split(' ').slice(1).join(' ') || '',
          email: customerData.email,
          phone: customerData.phone
        }
      });

      if (response.data.success) {
        setOrderId(response.data.orderId);
        return response.data.orderId;
      } else {
        throw new Error(response.data.error || 'Failed to create PayPal order');
      }

    } catch (error) {
      console.error('PayPal create order error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data, actions) => {
    try {
      setLoading(true);
      setError(null);

      // Capture payment on our backend
      const response = await apiClient.post('/api/payments/paypal/capture', {
        orderId: data.orderID
      });

      if (response.data.success) {
        const paymentResult = {
          transactionId: response.data.transactionId,
          captureId: response.data.captureId,
          amount: response.data.amount,
          currency: response.data.currency,
          status: response.data.status,
          method: 'paypal',
          orderId: data.orderID
        };

        console.log('✅ PayPal payment successful:', paymentResult);
        
        if (onSuccess) {
          onSuccess(paymentResult);
        }
      } else {
        throw new Error(response.data.error || 'Payment capture failed');
      }

    } catch (error) {
      console.error('PayPal capture error:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onErrorHandler = (error) => {
    console.error('PayPal error:', error);
    setError(error.message || 'PayPal payment failed');
    if (onError) {
      onError(error);
    }
  };

  const onCancelHandler = (data) => {
    console.log('PayPal payment cancelled:', data);
    if (onCancel) {
      onCancel(data);
    }
  };

  if (!amount || amount <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Invalid payment amount</p>
      </div>
    );
  }

  return (
    <div className="paypal-checkout-container">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Processing payment...</span>
        </div>
      )}

      <PayPalScriptProvider options={paypalOptions}>
        <div className="paypal-buttons-container">
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 55
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
            onCancel={onCancelHandler}
            disabled={loading}
          />
        </div>
      </PayPalScriptProvider>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          💳 Secure payment powered by PayPal
        </p>
        <p className="text-xs text-gray-400 mt-1">
          You will be redirected to PayPal to complete your payment
        </p>
      </div>
    </div>
  );
};

export default PayPalCheckout;