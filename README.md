# GO HAM PRO - Professional Service Booking Platform

A full-stack web application for managing service bookings, workers, and clients in the professional cleaning and detailing industry.

## 🚀 Features

- **Admin Dashboard** - Comprehensive management interface
- **Worker Management** - Track performance, availability, and assignments
- **Client Management** - Customer profiles, history, and segmentation
- **Booking System** - Real-time booking with worker alerts
- **Marketing Tools** - Email campaigns, coupons, and customer segmentation
- **Payment Processing** - Stripe integration for secure payments
- **Notifications** - Email and SMS alerts for bookings and updates

## 📋 Tech Stack

### Frontend
- React 19.2.0
- Tailwind CSS
- Axios for API calls
- Lucide React for icons
- FullCalendar for scheduling

### Backend
- Node.js with Express
- PostgreSQL (production) / In-memory (development)
- JWT Authentication
- SendGrid for emails
- Twilio for SMS
- Paypal for payments

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL (for production)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/go-ham-pro.git
   cd go-ham-pro
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   # Frontend
   cd client
   cp .env.example .env
   # Edit .env with your configuration
   
   # Backend
   cd ../server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This will start:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

### Individual Commands

```bash
# Install all dependencies
npm run install:all

# Start both servers (requires concurrently)
npm run dev

# Start only backend
npm run dev:server

# Start only frontend
npm run dev:client

# Build frontend for production
npm run build:client

# Run tests
npm test
```

## 📁 Project Structure

```
go-ham-pro/
├── client/                  # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/            # API service layer
│   │   ├── components/     # React components
│   │   ├── config/         # Configuration
│   │   ├── services/       # Business services
│   │   └── utils/          # Utility functions
│   ├── .env.example
│   └── package.json
│
├── server/                  # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Data models
│   │   └── index.js        # Server entry
│   ├── .env.example
│   └── package.json
│
├── DEPLOYMENT_PLAN.md      # Deployment guide
├── INTEGRATION_GUIDE.md    # Integration documentation
└── README.md               # This file
```

## 🔌 API Documentation

### Base URL
- Development: `http://localhost:5000`
- Production: `https://api.yourdomain.com`

### Endpoints

#### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `PATCH /api/bookings/:id/status` - Update status

#### Workers
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Create worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

#### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/segment/:type` - Get segmented clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client

For complete API documentation, see [server/README.md](server/README.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   cd client && npm run build
   ```

2. Deploy the `client/build` directory

3. Set environment variables in your hosting platform

### Backend (Heroku/Railway/DigitalOcean)

1. Push to your deployment platform
2. Set environment variables
3. Configure database connection
4. Run migrations if using database

See [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) for detailed instructions.

## 🔐 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
```

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
```

## 📚 Documentation

- [Deployment Plan](DEPLOYMENT_PLAN.md) - Architecture and deployment strategy
- [Integration Guide](INTEGRATION_GUIDE.md) - Frontend-backend integration
- [API Documentation](server/README.md) - Complete API reference

## 🐛 Troubleshooting

### Common Issues

**CORS Error**
- Ensure backend `.env` has correct `ALLOWED_ORIGINS`
- Restart backend server

**Connection Refused**
- Check backend is running on port 5000
- Verify `REACT_APP_API_URL` in frontend `.env`

**404 Errors**
- Check API routes are correctly defined
- Verify endpoint URLs match

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for more troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@gohampro.com
- Documentation: See guides in `/docs`

## ✨ Current Status

### ✅ Completed
- Frontend React application
- Backend API server
- API service layer
- Environment configuration
- Mock data for development
- Basic CRUD operations

### 🔄 In Progress
- Database integration
- Authentication system
- Payment processing
- Email/SMS notifications

### 📋 Planned
- Real-time notifications
- Advanced analytics
- Mobile app
- Multi-tenant support

## 📊 Project Stats

- **Frontend**: 1,941 lines (AdminDashboard.jsx)
- **Backend**: Fully functional REST API
- **API Endpoints**: 20+ endpoints
- **Components**: 14 React components
- **Services**: Email, SMS, Payment integration ready

---

**Built with ❤️ by GO HAM PRO Team**
