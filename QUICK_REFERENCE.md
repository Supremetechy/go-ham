# 🚀 GO HAM PRO - Quick Reference Card

## ⚡ Essential Commands

### Start Development
```bash
# Option 1: Start both servers manually
cd server && npm start          # Terminal 1 - Backend
cd client && npm start          # Terminal 2 - Frontend

# Option 2: Start both with concurrently (after npm install)
npm run dev                     # From root directory
```

### Access Points
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **API Docs:** http://localhost:5000/
- **Health Check:** http://localhost:5000/health

---

## 📡 API Endpoints Cheat Sheet

### Bookings
```bash
GET    /api/bookings              # Get all
GET    /api/bookings/:id          # Get one
POST   /api/bookings              # Create
PUT    /api/bookings/:id          # Update
DELETE /api/bookings/:id          # Delete
PATCH  /api/bookings/:id/status   # Update status
```

### Workers
```bash
GET    /api/workers               # Get all
POST   /api/workers               # Create
PUT    /api/workers/:id           # Update
DELETE /api/workers/:id           # Delete
PATCH  /api/workers/:id/toggle-status
```

### Clients
```bash
GET    /api/clients               # Get all
GET    /api/clients/segment/:type # vip/new/inactive
POST   /api/clients               # Create
PUT    /api/clients/:id           # Update
DELETE /api/clients/:id           # Delete
```

---

## 🧪 Quick Tests

### Test Backend
```bash
# Health check
curl http://localhost:5000/health

# Get bookings
curl http://localhost:5000/api/bookings

# Create booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"clientId":1,"serviceType":"House Washing","date":"2025-12-10","time":"10:00"}'
```

### Test in Browser Console
```javascript
// Test API connection
fetch('http://localhost:5000/health').then(r=>r.json()).then(console.log)

// Get bookings
fetch('http://localhost:5000/api/bookings').then(r=>r.json()).then(console.log)
```

---

## 📂 File Locations

### Important Files
- **Frontend Entry:** `client/src/App.js`
- **Main Dashboard:** `client/src/components/AdminDashboard.jsx`
- **API Services:** `client/src/api/`
- **Backend Entry:** `server/src/index.js`
- **API Routes:** `server/src/routes/`
- **Controllers:** `server/src/controllers/`

### Configuration
- **Frontend Env:** `client/.env`
- **Backend Env:** `server/.env`
- **Root Package:** `package.json`

---

## 🔧 Configuration Quick Setup

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

## 💻 Code Snippets

### Use API in Component
```javascript
import { bookingsAPI } from '../api';

// Fetch data
const [bookings, setBookings] = useState([]);
useEffect(() => {
  bookingsAPI.getAll().then(res => setBookings(res.data));
}, []);

// Create booking
const createBooking = async (data) => {
  const res = await bookingsAPI.create(data);
  setBookings([...bookings, res.data]);
};
```

---

## 🐛 Troubleshooting

### CORS Error
```bash
# Check server/.env has:
ALLOWED_ORIGINS=http://localhost:3000

# Restart backend
cd server && npm start
```

### Connection Refused
```bash
# Ensure backend is running
cd server && npm start

# Test backend
curl http://localhost:5000/health
```

### Build Errors
```bash
# Rebuild frontend
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **README.md** | Project overview & getting started |
| **FINAL_SUMMARY.md** | Complete summary of changes |
| **DEPLOYMENT_PLAN.md** | Architecture & deployment strategy |
| **INTEGRATION_GUIDE.md** | Frontend-backend integration |
| **DEPLOYMENT_CHECKLIST.md** | Step-by-step deployment |
| **QUICK_REFERENCE.md** | This cheat sheet |

---

## 🎯 Common Tasks

### Add New API Endpoint
1. Create route in `server/src/routes/`
2. Create controller in `server/src/controllers/`
3. Add API method in `client/src/api/`
4. Use in component

### Update Component
1. Edit `client/src/components/`
2. Save (hot reload automatic)
3. Test in browser

### Deploy
1. Build frontend: `cd client && npm run build`
2. Deploy frontend to Vercel/Netlify
3. Deploy backend to Railway/Heroku
4. Update environment variables

---

## ⚡ Keyboard Shortcuts

### In Terminal
- `Ctrl+C` - Stop server
- `Ctrl+Z` - Suspend process
- `Ctrl+L` - Clear terminal

### In Browser
- `F12` - Open DevTools
- `Ctrl+Shift+R` - Hard refresh
- `Ctrl+Shift+I` - Inspect element

---

## 🆘 Need Help?

1. Check server logs in terminal
2. Check browser console (F12)
3. Review documentation files
4. Test API with curl

---

**Pro Tip:** Keep this file open while developing for quick reference!
