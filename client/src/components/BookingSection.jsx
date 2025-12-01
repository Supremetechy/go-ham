import React, { useState } from 'react';
import CheckoutModal from './CheckoutModal';

function BookingSection() {
  const [data, setData] = useState({ name: '', email: '', phone: '', address: '', service: '', date: '', time: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Service pricing
  const servicePricing = {
    'Mobile Detailing': 150,
    'Gutter Cleaning': 120,
    'Residential Washing': 100,
    'Commercial': 200
  };

  // Update estimated price when service changes
  const handleServiceChange = (service) => {
    setData({...data, service});
    setEstimatedPrice(servicePricing[service] || 0);
  };

  const submit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!data.name || !data.email || !data.phone || !data.address || !data.service || !data.date || !data.time) {
      alert('Please fill in all required fields');
      return;
    }

    // Show payment modal
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      // Prepare booking data with payment info
      const bookingData = {
        id: Date.now(),
        name: data.name,
        phone: data.phone,
        email: data.email,
        serviceType: data.service,
        date: data.date,
        time: data.time,
        address: data.address,
        instructions: data.notes || '',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
        payment: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          method: paymentResult.method,
          status: paymentResult.status
        }
      };

      // Use enterprise system if available, otherwise fallback to localStorage
      if (window.enterpriseSystem && window.enterpriseSystem.processBooking) {
        const result = await window.enterpriseSystem.processBooking(bookingData);
        console.log('Enterprise booking processed:', result);
        
        // Show enhanced success message
        alert(`✅ Payment successful! Booking confirmed. ${result.workersNotified || 0} workers notified via email & SMS.`);
      } else {
        // Fallback to basic localStorage
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(bookingData);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        alert('✅ Payment successful! Booking confirmed.');
      }

      setSubmitted(true);
      setShowPayment(false);
      
      setTimeout(() => {
        setSubmitted(false);
        setData({ name: '', email: '', phone: '', address: '', service: '', date: '', time: '', notes: '' });
        setEstimatedPrice(0);
      }, 3000);

    } catch (error) {
      console.error('Booking confirmation failed:', error);
      alert('❌ Booking confirmation failed. Please contact support with your transaction ID.');
    }
  };

  return (
    <section id="booking" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Schedule Service</h2>
        {submitted ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600">We'll contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <input required type="text" placeholder="Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input required type="email" placeholder="Email" value={data.email} onChange={e => setData({...data, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input required type="tel" placeholder="Phone" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input required type="text" placeholder="Address" value={data.address} onChange={e => setData({...data, address: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <select required value={data.service} onChange={e => handleServiceChange(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select Service</option>
              <option value="Mobile Detailing">Mobile Detailing - $150</option>
              <option value="Gutter Cleaning">Gutter Cleaning - $120</option>
              <option value="Residential Washing">Residential Washing - $100</option>
              <option value="Commercial">Commercial - $200</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input required type="date" value={data.date} min={new Date().toISOString().split('T')[0]} onChange={e => setData({...data, date: e.target.value})} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              <select required value={data.time} onChange={e => setData({...data, time: e.target.value})} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Time</option>
                <option>8-10 AM</option>
                <option>10-12 PM</option>
                <option>12-2 PM</option>
                <option>2-4 PM</option>
                <option>4-6 PM</option>
              </select>
            </div>
            <textarea placeholder="Special Instructions (optional)" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} rows="4" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            
            {/* Price Display */}
            {estimatedPrice > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Price:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${estimatedPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Final price may vary based on property size and condition
                </p>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center"
              disabled={!estimatedPrice}
            >
              {estimatedPrice > 0 ? (
                <>
                  <span>Proceed to Payment</span>
                  <span className="ml-2 text-lg">${estimatedPrice.toFixed(2)}</span>
                </>
              ) : (
                'Select a Service'
              )}
            </button>
          </form>
        )}

        {/* Payment Checkout Modal */}
        <CheckoutModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          bookingData={data}
          amount={estimatedPrice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </section>
  );
}

export default BookingSection;