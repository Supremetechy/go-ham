# GO HAM PRO - Frontend-Backend Integration Guide

## 🎉 Current Status

### ✅ Completed
- [x] Cleaned up duplicate files (extras/ folder deleted)
- [x] Created API service layer (client/src/api/)
- [x] Setup backend server (server/)
- [x] Installed all dependencies
- [x] Created environment configuration
- [x] Backend mock API ready to run

### 🔄 Next Steps
- [ ] Start backend server
- [ ] Update AdminDashboard to use API
- [ ] Test API integration
- [ ] Add real database (PostgreSQL)
- [ ] Deploy to production

---

## 📁 Project Structure

```
go-ham-pro/
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                    # ✅ NEW - API service layer
│   │   │   ├── client.js          # Axios base client
│   │   │   ├── bookings.js        # Bookings endpoints
│   │   │   ├── workers.js         # Workers endpoints
│   │   │   ├── clients.js         # Clients endpoints
│   │   │   └── index.js           # Export all
│   │   ├── components/
│   │   │   └── AdminDashboard.jsx # Main dashboard
│   │   ├── config/                # ✅ NEW - Configuration
│   │   │   └── index.js
│   │   ├── services/              # Email/SMS services
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example               # ✅ NEW
│   ├── .env                       # ✅ NEW (configure)
│   └── package.json
│
├── server/                         # ✅ NEW - Backend API
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth, validation
│   │   ├── models/                # Mock data
│   │   └── index.js               # Server entry
│   ├── .env.example
│   └── package.json
│
├── backups/                        # ✅ Backed up extras/
└── DEPLOYMENT_PLAN.md             # ✅ Architecture docs
```

---

## 🚀 Quick Start

### 1. Start Backend Server

```bash
# Terminal 1: Backend
cd server
cp .env.example .env
# Edit .env if needed (defaults should work)
npm run dev
```

You should see:
```
🚀 GO HAM PRO Server running on port 5000
📍 Environment: development
🔗 API URL: http://localhost:5000
```

### 2. Start Frontend

```bash
# Terminal 2: Frontend
cd client
npm start
```

Frontend will open at: http://localhost:3000

### 3. Test API Connection

Open browser console and test:
```javascript
// Test API connection
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log);
```

---

## 🔌 API Endpoints Reference

### Base URL
- Development: `http://localhost:5000`
- Production: `https://api.gohampro.com` (configure later)

### Available Endpoints

#### Bookings
```
GET    /api/bookings           # Get all bookings
GET    /api/bookings/:id       # Get specific booking
POST   /api/bookings           # Create booking
PUT    /api/bookings/:id       # Update booking
DELETE /api/bookings/:id       # Delete booking
PATCH  /api/bookings/:id/status # Update status
```

#### Workers
```
GET    /api/workers            # Get all workers
GET    /api/workers/:id        # Get specific worker
POST   /api/workers            # Create worker
PUT    /api/workers/:id        # Update worker
DELETE /api/workers/:id        # Delete worker
PATCH  /api/workers/:id/toggle-status
```

#### Clients
```
GET    /api/clients            # Get all clients
GET    /api/clients/:id        # Get specific client
GET    /api/clients/segment/:type  # Get segmented (vip/new/inactive)
POST   /api/clients            # Create client
PUT    /api/clients/:id        # Update client
DELETE /api/clients/:id        # Delete client
```

---

## 💻 Integration Examples

### Example 1: Fetch Bookings in Component

**Before (Mock Data):**
```javascript
const [bookings, setBookings] = useState([
  { id: 1, clientId: 1, serviceType: 'House Washing', ... }
]);
```

**After (API):**
```javascript
import { bookingsAPI } from '../api';

const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchBookings() {
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchBookings();
}, []);
```

### Example 2: Create New Booking

**Before:**
```javascript
const newBooking = { ...bookingData, id: bookings.length + 1 };
setBookings([...bookings, newBooking]);
```

**After:**
```javascript
const newBooking = await bookingsAPI.create(bookingData);
setBookings([...bookings, newBooking.data]);
```

### Example 3: Update Booking Status

**Before:**
```javascript
setBookings(bookings.map(b => 
  b.id === id ? { ...b, status } : b
));
```

**After:**
```javascript
const updated = await bookingsAPI.updateStatus(id, status);
setBookings(bookings.map(b => 
  b.id === id ? updated.data : b
));
```

---

## 🔧 Configuration

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🧪 Testing the Integration

### 1. Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-30T...",
  "environment": "development"
}
```

### 2. Test Bookings API
```bash
# Get all bookings
curl http://localhost:5000/api/bookings

# Create booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "serviceType": "House Washing",
    "date": "2025-12-10",
    "time": "10:00",
    "address": "123 Test St"
  }'
```

### 3. Test in Browser Console
```javascript
// Get all bookings
fetch('http://localhost:5000/api/bookings')
  .then(r => r.json())
  .then(console.log);

// Get all workers
fetch('http://localhost:5000/api/workers')
  .then(r => r.json())
  .then(console.log);
```

---

## 📝 Migration Checklist

### Phase 1: Basic Integration (Current)
- [x] Setup backend server structure
- [x] Create API service layer
- [x] Install dependencies
- [ ] Update AdminDashboard to use bookingsAPI
- [ ] Update AdminDashboard to use workersAPI
- [ ] Update AdminDashboard to use clientsAPI
- [ ] Test all CRUD operations

### Phase 2: Features
- [ ] Add JWT authentication
- [ ] Implement email notifications
- [ ] Implement SMS notifications
- [ ] Add payment processing
- [ ] Add file uploads

### Phase 3: Database
- [ ] Setup PostgreSQL
- [ ] Create database schema
- [ ] Implement Sequelize models
- [ ] Migrate from mock data

### Phase 4: Deployment
- [ ] Setup environment variables
- [ ] Configure CORS for production
- [ ] Deploy backend (Heroku/Railway/DigitalOcean)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Setup CI/CD pipeline

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Error:** "Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS"

**Solution:** Backend already has CORS configured. If issue persists:
1. Check server/.env has `ALLOWED_ORIGINS=http://localhost:3000`
2. Restart backend server
3. Clear browser cache

### Issue: Connection Refused
**Error:** "Failed to fetch" or "Connection refused"

**Solution:**
1. Ensure backend is running: `cd server && npm run dev`
2. Check backend is on port 5000: `curl http://localhost:5000/health`
3. Check firewall/antivirus not blocking

### Issue: 404 Not Found
**Error:** "Cannot GET /api/bookings"

**Solution:**
1. Check API URL in client/.env is correct
2. Verify route exists in server/src/routes/
3. Check server logs for errors

---

## 🎯 Next Immediate Actions

1. **Start both servers:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   cd client && npm start
   ```

2. **Test API connection:**
   - Open http://localhost:5000 in browser
   - Should see API info page

3. **Update AdminDashboard:**
   - Replace mock data with API calls
   - See example code above

4. **Test full flow:**
   - Create a booking from frontend
   - Verify it appears in dashboard
   - Update and delete

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Axios Documentation](https://axios-http.com/)
- [React Hooks Guide](https://react.dev/reference/react)
- [REST API Best Practices](https://restfulapi.net/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check server logs in Terminal 1
2. Check browser console in DevTools
3. Review API documentation in server/README.md
4. Test endpoints with curl/Postman

Current implementation uses **mock data** stored in memory. This is perfect for:
- ✅ Development and testing
- ✅ Prototyping features
- ✅ Frontend integration

For production, you'll need:
- ⏳ Real database (PostgreSQL/MongoDB)
- ⏳ Authentication (JWT)
- ⏳ Environment-specific configs
- ⏳ Error logging and monitoring
