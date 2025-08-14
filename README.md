# Dashboard++ - Advanced CRM Analytics Dashboard

A powerful, production-ready CRM analytics dashboard for Kommo with comprehensive features, subscription management, and enterprise-grade security.

## 🚀 Features

- 📊 **Real-time CRM Analytics** - Comprehensive dashboard with lead tracking, sales funnel analysis, and performance metrics
- 🎨 **Dark/Light Mode** - Beautiful, responsive UI with theme switching
- 🔐 **User Authentication** - Secure JWT-based authentication with subscription management
- 💳 **Stripe Integration** - Complete payment processing with subscription tiers
- 📈 **Advanced Charts** - Interactive charts and reports using Chart.js
- 🔄 **Auto-refresh** - Real-time data updates and token refresh
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🎯 **Usage Tracking** - Monitor API usage and enforce limits per subscription tier
- 🛡️ **Production Ready** - Docker deployment, automated backups, health monitoring
- 🔧 **SQLite Optimized** - High-performance database with WAL mode and automated maintenance

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Chart.js** - Interactive charts and graphs
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible UI components

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite** - High-performance database with WAL mode
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Stripe** - Payment processing
- **Axios** - HTTP client
- **node-cron** - Scheduled tasks
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git
- Docker & Docker Compose (for production)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/badreddine7/dashboard-kommo.git
cd dashboard-kommo
```

2. **Install dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../kommo-pulse-main
npm install
```

3. **Environment setup**
```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your configuration

# Frontend
cd ../kommo-pulse-main
cp env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd kommo-pulse-main
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_PROFESSIONAL=price_your_professional_price_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id

# Kommo OAuth
CLIENT_ID=your_kommo_client_id
CLIENT_SECRET=your_kommo_client_secret
CALLBACK_URL=http://localhost:3000/kommo/callback

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# SQLite Database Configuration
DB_PATH=./saas.db
DB_BACKUP_PATH=./backups/
DB_BACKUP_RETENTION_DAYS=30

# Security
SESSION_SECRET=your_session_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

### Frontend Environment Variables

Create `kommo-pulse-main/.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# App Configuration
VITE_APP_NAME=Dashboard++
VITE_APP_VERSION=2.0.0
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run setup        # Set up Stripe products and prices
npm run db:show      # Show database content
npm run db:backup    # Manual database backup
npm run db:optimize  # Manual database optimization
npm run db:status    # Check maintenance status
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure

```
dashboard-kommo/
├── backend/                     # Backend API server
│   ├── routes/                 # API route handlers
│   ├── services/               # Business logic
│   ├── middleware/             # Express middleware
│   ├── config/                 # Configuration files
│   ├── scripts/                # Database maintenance scripts
│   ├── database.js             # Database setup and helpers
│   ├── server.js               # Main server file
│   └── Dockerfile              # Backend Docker configuration
├── kommo-pulse-main/           # Frontend React app
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── Dockerfile              # Frontend Docker configuration
│   └── nginx.conf              # Nginx configuration
├── docker-compose.yml          # Docker orchestration
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Set up environment variables**
```bash
# Copy and configure environment files
cp backend/env.example backend/.env
cp kommo-pulse-main/env.example kommo-pulse-main/.env
```

2. **Deploy with Docker Compose**
```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh
```

3. **Verify deployment**
```bash
# Check health endpoints
curl http://localhost:3000/health
curl http://localhost/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Manual Deployment

**Backend:**
```bash
cd backend
npm install --production
npm start
```

**Frontend:**
```bash
cd kommo-pulse-main
npm install
npm run build
# Deploy the 'dist' folder to your hosting service
```

## 📊 Subscription Tiers

| Feature | FREE Trial | Professional | Enterprise |
|---------|------------|--------------|------------|
| Dashboard Access | ✅ | ✅ | ✅ |
| Basic Charts | ✅ | ✅ | ✅ |
| Advanced Charts | ❌ | ✅ | ✅ |
| Activity Heatmap | ❌ | ✅ | ✅ |
| Lead Limit | 1,000 | 10,000 | Unlimited |
| Team Members | 1 | 5 | Unlimited |
| API Calls/Day | 1,000 | 10,000 | 50,000 |
| Custom Reports | ❌ | 5 | Unlimited |
| Export Formats | None | CSV, PDF | All formats |
| Priority Support | ❌ | ✅ | ✅ |

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **CORS Protection** - Configured for production domains
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Server-side validation for all inputs
- **Security Headers** - Helmet middleware for security headers
- **HTTPS Required** - All production deployments use HTTPS
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content Security Policy headers

## 🗄️ Database Management

### SQLite Production Features

- **WAL Mode** - Better concurrency and performance
- **Automated Backups** - Daily backups at 2 AM UTC
- **Weekly Optimization** - VACUUM and ANALYZE operations
- **Backup Retention** - Configurable retention policy (default 30 days)
- **Health Monitoring** - Database connectivity and performance checks

### Database Commands

```bash
# Show database content
npm run db:show

# Manual backup
npm run db:backup

# Manual optimization
npm run db:optimize

# Check maintenance status
npm run db:status
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure SQLite file has write permissions
   - Check database path in `backend/database.js`
   - Verify WAL mode is enabled in production

2. **CORS errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check CORS configuration in `server.js`

3. **Kommo API errors**
   - Verify `CLIENT_ID` and `CLIENT_SECRET`
   - Check callback URL configuration
   - Ensure tokens are properly stored and refreshed

4. **Stripe integration issues**
   - Verify Stripe keys are correct
   - Check webhook endpoint configuration
   - Ensure subscription tiers are set up

5. **Docker deployment issues**
   - Check Docker and Docker Compose installation
   - Verify environment variables are set
   - Check container logs for errors

### Logs and Monitoring

The application includes comprehensive logging:
- **Backend logs** - Database operations, API requests, errors
- **Frontend logs** - User actions, API calls, errors
- **Health checks** - Database, Kommo API, Stripe API monitoring
- **Maintenance logs** - Backup and optimization operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check this README and inline code comments
- **Issues** - Create an issue on [GitHub](https://github.com/badreddine7/dashboard-kommo/issues)
- **Email** - Contact support@dashboardplus.com

## 🔄 Changelog

### Version 2.0.0 (Current)
- ✅ Complete authentication system with JWT
- ✅ Subscription management with Stripe integration
- ✅ Advanced analytics dashboard with real-time data
- ✅ Usage tracking and subscription limits
- ✅ Production-ready logging and monitoring
- ✅ Comprehensive error handling and validation
- ✅ Responsive design with dark/light themes
- ✅ SQLite production optimization with WAL mode
- ✅ Automated database backups and maintenance
- ✅ Docker deployment with health checks
- ✅ Security enhancements with Helmet and rate limiting
- ✅ Kommo OAuth integration with token management

### Version 1.0.0
- ✅ Basic CRM analytics dashboard
- ✅ Kommo API integration
- ✅ Basic authentication
- ✅ Chart.js integration

---

**Built with ❤️ by the Dashboard++ Team**

*Transform your Kommo CRM data into actionable insights with Dashboard++*
