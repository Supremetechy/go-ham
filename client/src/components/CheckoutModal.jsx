import React, { useState } from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';
import PayPalCheckout from './PayPalCheckout';

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  bookingData, 
  amount, 
  onPaymentSuccess 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  if (!isOpen) return null;

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setProcessing(false);
    
    // Call parent success handler
    if (onPaymentSuccess) {
      onPaymentSuccess({
        ...result,
        bookingData
      });
    }

    // Auto-close after success message
    setTimeout(() => {
      onClose();
      setPaymentResult(null);
    }, 3000);
  };

  const handlePaymentError = (error) => {
    setProcessing(false);
    console.error('Payment error:', error);
  };

  const handlePaymentCancel = () => {
    setProcessing(false);
    console.log('Payment cancelled by user');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Payment Success */}
        {paymentResult ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              Payment Successful!
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Transaction ID:</strong> {paymentResult.transactionId}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Amount:</strong> {formatAmount(paymentResult.amount)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Method:</strong> PayPal
              </p>
            </div>
            <p className="text-gray-600">
              Your booking is confirmed! We'll send you a confirmation email shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Booking Summary */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{bookingData?.service || 'Service'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{bookingData?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{bookingData?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{bookingData?.address}</span>
                </div>
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatAmount(amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                      <DollarSign size={18} className="text-white" />
                    </div>
                    <span className="font-medium">PayPal</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'paypal' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-all opacity-50 cursor-not-allowed ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  disabled
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center mr-3">
                      <CreditCard size={18} className="text-white" />
                    </div>
                    <span className="font-medium">Credit Card (Coming Soon)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 border-gray-300`}>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-6">
              {paymentMethod === 'paypal' && (
                <PayPalCheckout
                  amount={amount}
                  description={`${bookingData?.service} - ${bookingData?.date}`}
                  customerData={{
                    name: bookingData?.name || '',
                    email: bookingData?.email || '',
                    phone: bookingData?.phone || ''
                  }}
                  jobId={`BOOKING-${Date.now()}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}

              {paymentMethod === 'card' && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Credit card payments coming soon!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;