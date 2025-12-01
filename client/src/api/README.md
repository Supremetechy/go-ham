# API Services Documentation

## Overview
This directory contains all API service modules for communicating with the backend.

## Structure
```
api/
├── client.js       # Base axios client with interceptors
├── bookings.js     # Booking management endpoints
├── workers.js      # Worker management endpoints
├── clients.js      # Client management endpoints
└── index.js        # Export all services
```

## Usage Example

### In Components
```javascript
import { bookingsAPI, workersAPI, clientsAPI } from '../api';

// Fetch all bookings
const bookings = await bookingsAPI.getAll();

// Create a new booking
const newBooking = await bookingsAPI.create({
  clientId: 1,
  serviceType: 'House Washing',
  date: '2025-12-05',
  time: '10:00'
});

// Update booking status
await bookingsAPI.updateStatus(bookingId, 'completed');
```

### In Hooks
```javascript
import { useState, useEffect } from 'react';
import { bookingsAPI } from '../api';

function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchBookings() {
      try {
        const data = await bookingsAPI.getAll();
        setBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookings();
  }, []);
  
  return { bookings, loading };
}
```

## Authentication
The API client automatically includes the auth token from localStorage in all requests.
Store the token after login:
```javascript
localStorage.setItem('authToken', token);
```

## Error Handling
All API calls should be wrapped in try-catch blocks. The client automatically handles 401 errors by redirecting to login.

## Mock Mode
If no backend is available, the API will return mock data. Set `REACT_APP_API_URL=mock` to enable mock mode.
