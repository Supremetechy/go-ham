// Mock Data for Development
module.exports = {
  workers: [
    { id: 1, name: 'Mike Johnson', zone: 'North', services: ['House Washing', 'Gutter Cleaning'], email: 'mike@goham.com', phone: '+15551234567', isActive: true },
    { id: 2, name: 'Sarah Williams', zone: 'South', services: ['Mobile Detailing', 'Window Cleaning'], email: 'sarah@goham.com', phone: '+15551234568', isActive: true },
  ],
  
  clients: [
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+15559871234', address: '123 Main St, Boise, ID', totalSpent: 450, tags: ['VIP'], lastService: '2025-11-20' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com', phone: '+15559875678', address: '456 Oak Ave, Boise, ID', totalSpent: 120, tags: ['New Customer'], lastService: '2025-11-28' },
  ],
  
  bookings: [
    { id: 1, clientId: 1, workerId: null, serviceType: 'House Washing', date: '2025-12-05', time: '10:00', status: 'pending', address: '123 Main St, Boise, ID', price: 150 },
    { id: 2, clientId: 2, workerId: 1, serviceType: 'Mobile Detailing', date: '2025-12-06', time: '14:00', status: 'accepted', address: '456 Oak Ave, Boise, ID', price: 120 },
  ],
};
