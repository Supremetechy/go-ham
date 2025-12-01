import React, { useState, useEffect } from 'react';

const serviceOptions = {
  'mobile-detailing': { base: 75, perSqFt: 0 },
  'house-washing': { base: 250, perSqFt: 0.15 },
  'gutter-cleaning': { base: 150, perSqFt: 0.1 },
  'commercial-washing': { base: 500, perSqFt: 0.2 },
};

const QuickPriceCalculator = () => {
  const [service, setService] = useState('house-washing');
  const [sqFt, setSqFt] = useState(2000);
  const [price, setPrice] = useState(0);
  const [quoteSaved, setQuoteSaved] = useState(false);

  useEffect(() => {
    const calculatePrice = () => {
      const selectedService = serviceOptions[service];
      if (!selectedService) {
        setPrice(0);
        return;
      }
      const calculatedPrice = selectedService.base + selectedService.perSqFt * sqFt;
      setPrice(calculatedPrice);
    };
    calculatePrice();
  }, [service, sqFt]);

  const handleBookNow = () => {
    // 1. Scroll to the booking section
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 2. Pre-fill the form fields
    // Use a short delay to ensure the component is visible before filling
    setTimeout(() => {
      const serviceTypeInput = document.getElementById('serviceType');
      const instructionsInput = document.getElementById('instructions');

      if (serviceTypeInput) {
        serviceTypeInput.value = service;
      }
      if (instructionsInput) {
        instructionsInput.value = `Quote Reference: $${price.toFixed(2)} for ${sqFt} sq ft.`;
      }

      // Optional: Trigger a notification
      if (window.showNotification) {
        window.showNotification('Booking form pre-filled with your quote!', 'info');
      }
    }, 500);
  };

  const handleSaveQuote = () => {
    const quote = {
      service,
      sqFt,
      price,
      date: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem('savedQuote', JSON.stringify(quote));
    setQuoteSaved(true);

    // Show a confirmation message
    if (window.showNotification) {
        window.showNotification(`Quote of $${price.toFixed(2)} saved!`, 'success');
    }

    // Reset confirmation after a few seconds
    setTimeout(() => setQuoteSaved(false), 3000);
  };

  return (
    <section id="calculator" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Instant Price Estimate</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Get a quick estimate for our services. Final price may vary based on inspection.
        </p>

        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Service Selection */}
            <div>
              <label htmlFor="service-select" className="block text-left font-semibold text-gray-700 mb-2">
                Select Service
              </label>
              <select
                id="service-select"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="house-washing">House Washing</option>
                <option value="mobile-detailing">Mobile Detailing</option>
                <option value="gutter-cleaning">Gutter Cleaning</option>
                <option value="commercial-washing">Commercial Washing</option>
              </select>
            </div>

            {/* Square Footage Input */}
            <div>
              <label htmlFor="sq-ft-input" className="block text-left font-semibold text-gray-700 mb-2">
                Square Footage (sq ft)
              </label>
              <input
                type="number"
                id="sq-ft-input"
                value={sqFt}
                onChange={(e) => setSqFt(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                step="100"
                min="500"
              />
            </div>
          </div>

          {/* Calculated Price */}
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-600">Estimated Price</p>
            <p className="text-5xl font-bold text-blue-600 my-2">
              ${price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              For {service.replace('-', ' ')} of a {sqFt} sq ft area.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleBookNow}
              className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Book Now
            </button>
            <button
              onClick={handleSaveQuote}
              className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
            >
              {quoteSaved ? 'Quote Saved!' : 'Save Quote'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickPriceCalculator;