import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAuthToken, getAuthToken } from '../utils/auth';

function PriceCalculator() {
  const [tab, setTab] = useState('mobile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quote, setQuote] = useState(null);
  
  // Mobile Detailing
  const [vehicle, setVehicle] = useState('sedan');
  const [pkg, setPkg] = useState('full');
  const [dist, setDist] = useState(5);
  const [wax, setWax] = useState(false);
  const [engine, setEngine] = useState(false);
  
  // Gutter Cleaning
  const [height, setHeight] = useState('one');
  const [length, setLength] = useState(100);
  const [obstruct, setObstruct] = useState('medium');
  const [guard, setGuard] = useState(false);
  
  const navigate = useNavigate();

  const calculate = () => {
    let total = 0;
    const breakdown = [];
    
    if (tab === 'mobile') {
      const base = { sedan: 100, suv: 120, truck: 130 }[vehicle];
      const pkgPrice = { exterior: 0, interior: 20, full: 50 }[pkg];
      total = base + pkgPrice + (dist > 10 ? 20 : 0) + (wax ? 30 : 0) + (engine ? 40 : 0);
      breakdown.push({ label: 'Base', value: base }, { label: 'Package', value: pkgPrice });
      if (dist > 10) breakdown.push({ label: 'Distance', value: 20 });
      if (wax) breakdown.push({ label: 'Wax', value: 30 });
      if (engine) breakdown.push({ label: 'Engine', value: 40 });
    } else {
      const rate = { one: 1.5, two: 2, three: 2.5 }[height];
      const obs = { none: 0, light: 20, medium: 40, heavy: 75 }[obstruct];
      total = rate * length + obs + (guard ? 50 : 0);
      breakdown.push({ label: 'Cleaning', value: rate * length }, { label: 'Obstruction', value: obs });
      if (guard) breakdown.push({ label: 'Guard', value: 50 });
    }
    
    setQuote({ 
      service: tab === 'mobile' ? 'Mobile Detailing' : 'Gutter Cleaning', 
      total, 
      breakdown, 
      name, 
      email 
    });
  };

  const save = () => {
    if (!quote) return;
    const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    quotes.unshift({ ...quote, date: new Date().toISOString() });
    localStorage.setItem('quotes', JSON.stringify(quotes));
    alert('✅ Quote saved!');
  };

  const handleBookNow = () => {
    // Check if quote exists
    if (!quote) {
      alert('Please calculate a quote first');
      return;
    }

    // Validate name and email
    if (!name || !email) {
      alert('Please enter your name and email');
      return;
    }

    // Check if user is authenticated
    if (!hasAuthToken()) {
      alert('Please log in to book a service');
      navigate('/login');
      return;
    }

    // Get the auth token
    const token = getAuthToken();

    // Prepare booking data using the quote information
    const bookingData = {
      service: quote.service,
      price: quote.total,
      breakdown: quote.breakdown,
      customerName: name,
      customerEmail: email,
      timestamp: new Date().toISOString(),
      token: token
    };

    // Make API call or navigate to booking confirmation
    console.log('Booking with token:', token);
    console.log('Booking data:', bookingData);

    // Navigate to confirmation
    navigate('/booking-confirmation', { state: bookingData });
  };

  return (
    <section id="calculator" className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-2">💧 Price Calculator</h2>
          <p className="text-gray-600">Get an instant quote</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Your Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="flex space-x-2 mb-8">
          <button 
            onClick={() => setTab('mobile')} 
            className={`flex-1 px-6 py-3 rounded-lg font-medium ${tab === 'mobile' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100'}`}
          >
            🚗 Mobile Detailing
          </button>
          <button 
            onClick={() => setTab('gutter')} 
            className={`flex-1 px-6 py-3 rounded-lg font-medium ${tab === 'gutter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100'}`}
          >
            🏠 Gutter Cleaning
          </button>
        </div>

        {tab === 'mobile' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['sedan', 'suv', 'truck'].map(v => (
                  <button 
                    key={v} 
                    onClick={() => setVehicle(v)} 
                    className={`py-3 rounded-lg ${vehicle === v ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Package</label>
              <div className="grid grid-cols-3 gap-3">
                {[['exterior', 'Exterior'], ['interior', 'Interior'], ['full', 'Full']].map(([id, label]) => (
                  <button 
                    key={id} 
                    onClick={() => setPkg(id)} 
                    className={`py-3 rounded-lg ${pkg === id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Distance: {dist} mi</label>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={dist} 
                onChange={e => setDist(+e.target.value)} 
                className="w-full" 
              />
              <p className="text-sm text-gray-600">Free within 10 miles</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Add-ons</h3>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={wax} 
                  onChange={e => setWax(e.target.checked)} 
                  className="w-5 h-5" 
                />
                <span>Wax & Polish (+$30)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={engine} 
                  onChange={e => setEngine(e.target.checked)} 
                  className="w-5 h-5" 
                />
                <span>Engine Bay (+$40)</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Roof Height</label>
              <div className="grid grid-cols-3 gap-3">
                {[['one', '1 Story'], ['two', '2 Story'], ['three', '3+ Story']].map(([id, label]) => (
                  <button 
                    key={id} 
                    onClick={() => setHeight(id)} 
                    className={`py-3 rounded-lg ${height === id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Length: {length} ft</label>
              <input 
                type="range" 
                min="20" 
                max="500" 
                step="10" 
                value={length} 
                onChange={e => setLength(+e.target.value)} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Obstruction</label>
              <select 
                value={obstruct} 
                onChange={e => setObstruct(e.target.value)} 
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>

            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={guard} 
                onChange={e => setGuard(e.target.checked)} 
                className="w-5 h-5" 
              />
              <span>Gutter Guard (+$50)</span>
            </label>
          </div>
        )}

        <button 
          onClick={calculate} 
          className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all"
        >
          Calculate Quote 💰
        </button>

        {quote && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">Your Estimated Total</p>
              <p className="text-5xl font-bold text-blue-600">${quote.total.toFixed(2)}</p>
            </div>

            <div className="space-y-2 mb-6">
              {quote.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="font-medium">${b.value.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={save} 
                className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Save Quote
              </button>
              <button 
                onClick={handleBookNow}
                className="bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PriceCalculator;