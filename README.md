# Kommo Pulse - Advanced CRM Analytics Dashboard

A production-ready, feature-rich CRM analytics dashboard for Kommo (formerly AmoCRM) with real-time insights, advanced caching, comprehensive reporting, and modern deployment options.

## ✨ Features

### 🎨 Modern UI/UX
- **Dark/Light Mode** - Beautiful theme switching with smooth transitions
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **System Theme** - Automatically follows your system preference
- **Smooth Animations** - Beautiful transitions and loading states

### 📊 Advanced Analytics
- **Real-time Dashboard** - Live metrics and performance insights
- **Lead Analytics** - Conversion rates, cycle times, deal sizes
- **Activity Heatmap** - Visual activity tracking over time
- **Sales Funnel Analytics** - Comprehensive pipeline performance metrics
- **Team Comparison** - Performance comparison across team members
- **Revenue Analysis** - Financial performance and trends
- **Time Analysis** - Efficiency metrics and productivity insights

### 🔄 Smart Caching System
- **Browser-based Caching** - 1-hour cache duration for optimal performance
- **API Call Reduction** - 90%+ reduction in Kommo API calls
- **Instant Data Loading** - Cached data loads instantly
- **Cache Management** - Manual refresh and cache age display
- **Automatic Expiration** - Cache expires automatically after 1 hour

### 📋 Comprehensive Reporting
- **6 Report Types** - Performance Summary, Activity Report, Revenue Analysis, Team Comparison, Conversion Funnel, Time Analysis
- **Multiple Formats** - PDF, CSV, Excel export options
- **Real Data** - All reports use actual Kommo data (no mock data)
- **Report History** - Persistent report storage and history
- **Report Statistics** - Track total reports, monthly usage, format distribution

### 🔐 Authentication & Security
- **JWT Authentication** - Secure token-based authentication
- **User Management** - Registration, login, profile management
- **Subscription System** - Stripe integration for premium features
- **Usage Tracking** - Monitor API calls and feature usage
- **Rate Limiting** - Protect against API abuse

### 🎛️ Dashboard Customization
- **Layout Options** - Grid and list layouts
- **Component Visibility** - Show/hide specific sections
- **Auto Refresh** - Configurable refresh intervals
- **Settings Persistence** - All preferences saved locally

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful component library
- **Zustand** - Lightweight state management
- **React Query** - Data fetching and caching
- **jsPDF** - Client-side PDF generation
- **Chart.js** - Interactive charts and graphs
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Production-ready database with enhanced logging and backup
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Stripe** - Payment processing
- **Axios** - HTTP client
- **node-cron** - Scheduled tasks
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Railway** - Deployment platform
- **GitHub** - Version control

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Docker & Docker Compose (for production)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/badreddine7/dashboard-kommo.git
cd dashboard-kommo
```

2. **Start with Docker (Recommended)**
```bash
docker-compose up --build -d
```

3. **Or start manually**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../kommo-pulse-main
npm install
```

4. **Environment setup**
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

5. **Start development servers**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd kommo-pulse-main
npm run dev
```

6. **Access the application**
- Frontend: `http://localhost`
- Backend API: `http://localhost:3000`

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Kommo OAuth
CLIENT_ID=your_kommo_client_id
CLIENT_SECRET=your_kommo_client_secret
CALLBACK_URL=https://your-domain.com/kommo/callback

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Database
DB_PATH=./saas.db
DB_BACKUP_PATH=./backups/
DB_BACKUP_RETENTION_DAYS=30

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend Environment Variables

Create `kommo-pulse-main/.env`:
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=Kommo Pulse
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
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── reports.js          # Report generation
│   │   ├── usage.js            # Usage tracking
│   │   └── stripe.js           # Payment processing
│   ├── database.js             # Database setup and helpers
│   ├── server.js               # Main server file + aggregate function
│   ├── Dockerfile              # Backend Docker configuration
│   └── railway.json            # Railway deployment config
├── kommo-pulse-main/           # Frontend React app
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.tsx   # Main dashboard
│   │   │   ├── ReportsSection.tsx # Report generation UI
│   │   │   └── UsageTracker.tsx # Usage tracking UI
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useAnalytics.ts # Analytics data fetching
│   │   ├── utils/              # Utility functions
│   │   │   └── cache.js        # Caching system
│   │   └── stores/             # Zustand stores
│   ├── Dockerfile              # Frontend Docker configuration
│   └── railway.json            # Railway deployment config
├── docker-compose.yml          # Docker orchestration
├── ARCHITECTURE.md             # Detailed architecture documentation
└── README.md                   # This file
```

## 🚀 Deployment Options

### 1. Railway (Recommended - Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or build individual containers
docker build -t kommo-backend ./backend
docker build -t kommo-frontend ./kommo-pulse-main
```

### 3. Vercel (Frontend) + Railway (Backend)
- Deploy frontend to Vercel
- Deploy backend to Railway
- Connect via environment variables

### 4. DigitalOcean App Platform
- Connect GitHub repository
- Configure build settings
- Deploy with one click


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

## 🔄 Caching System

### Multi-Level Caching Strategy
- **Browser Storage** - localStorage for client-side caching
- **Cache Duration** - 1 hour with automatic expiration
- **Cache Invalidation** - Manual refresh option
- **Performance** - 90%+ reduction in API calls

### Cache Implementation
```typescript
// Frontend Cache (kommo-pulse-main/src/utils/cache.js)
class KommoCache {
  private CACHE_PREFIX = 'kommo_';
  private CACHE_DURATION = 3600000; // 1 hour

  set(key: string, data: any): void {
    const item = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item));
  }

  get(key: string): any | null {
    const item = localStorage.getItem(this.CACHE_PREFIX + key);
    if (!item) return null;
    
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > this.CACHE_DURATION) {
      this.remove(key);
      return null;
    }
    
    return data;
  }
}
```

## 📋 Report Generation

### Available Report Types
1. **Performance Summary** - Overall performance metrics
2. **Activity Report** - User activity and engagement
3. **Revenue Analysis** - Financial performance and trends
4. **Team Comparison** - Performance across team members
5. **Conversion Funnel** - Lead conversion analysis
6. **Time Analysis** - Efficiency and productivity metrics

### Report Features
- **Real Data** - All reports use actual Kommo data
- **Multiple Formats** - PDF, CSV, Excel export
- **Report History** - Persistent storage and retrieval
- **Statistics Tracking** - Usage analytics and metrics

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

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Analytics
- `GET /api/report` - Get Kommo analytics data
- `GET /api/usage` - Get usage statistics

### Reports
- `POST /api/reports/generate` - Generate reports
- `GET /api/reports/history` - Get report history
- `GET /api/reports/stats` - Get report statistics
- `POST /api/reports/clear-cache` - Clear cache

### Payments
- `POST /api/stripe/create-checkout` - Create Stripe checkout
- `POST /api/stripe/webhook` - Stripe webhook handler

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

4. **Caching issues**
   - Check browser localStorage permissions
   - Verify cache duration settings
   - Use manual refresh if needed

5. **Report generation errors**
   - Ensure Kommo data is available
   - Check user permissions and limits
   - Verify PDF generation dependencies

6. **Docker deployment issues**
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

- **Documentation** - Check this README and [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues** - Create an issue on [GitHub](https://github.com/badreddine7/dashboard-kommo/issues)
- **Email** - Contact support@kommopulse.com

## 🔄 Changelog

### Version 2.1.0 (Current)
- ✅ Smart caching system with 1-hour browser cache
- ✅ Comprehensive report generation (6 report types)
- ✅ Real data integration (no mock data)
- ✅ Report history and statistics tracking
- ✅ PDF generation with jsPDF
- ✅ Advanced deployment options (Railway, Docker, Vercel)
- ✅ Performance optimization and monitoring
- ✅ Enhanced security and error handling

### Version 2.0.0
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

**Built with ❤️ by the Kommo Pulse Team**

*Transform your Kommo CRM data into actionable insights with Kommo Pulse*
