# Kommo Pulse - Advanced CRM Analytics Dashboard

A production-ready, feature-rich CRM analytics dashboard for Kommo (formerly AmoCRM) with real-time insights, advanced caching, comprehensive reporting, and modern deployment options.

## ✨ Features

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between dark and light themes with smooth transitions
- **System Theme**: Automatically follows your system preference
- **Responsive Design**: Mobile-optimized with adaptive layouts
- **Smooth Animations**: Beautiful transitions and loading states

### 📊 Advanced Analytics
- **Real-time Dashboard**: Live metrics and performance insights
- **Lead Analytics**: Conversion rates, cycle times, deal sizes
- **Activity Heatmap**: Visual activity tracking over time
- **Sales Funnel Analytics**: Comprehensive pipeline performance metrics
- **Team Comparison**: Performance comparison across team members
- **Revenue Analysis**: Financial performance and trends
- **Time Analysis**: Efficiency metrics and productivity insights

### 🔄 Smart Caching System
- **Browser-based Caching**: 1-hour cache duration for optimal performance
- **API Call Reduction**: 90%+ reduction in Kommo API calls
- **Instant Data Loading**: Cached data loads instantly
- **Cache Management**: Manual refresh and cache age display
- **Automatic Expiration**: Cache expires automatically after 1 hour

### 📋 Comprehensive Reporting
- **6 Report Types**: Performance Summary, Activity Report, Revenue Analysis, Team Comparison, Conversion Funnel, Time Analysis
- **Multiple Formats**: PDF, CSV, Excel export options
- **Real Data**: All reports use actual Kommo data (no mock data)
- **Report History**: Persistent report storage and history
- **Report Statistics**: Track total reports, monthly usage, format distribution

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **User Management**: Registration, login, profile management
- **Subscription System**: Stripe integration for premium features
- **Usage Tracking**: Monitor API calls and feature usage
- **Rate Limiting**: Protect against API abuse

### 🎛️ Dashboard Customization
- **Layout Options**: Grid and list layouts
- **Component Visibility**: Show/hide specific sections
- **Auto Refresh**: Configurable refresh intervals
- **Settings Persistence**: All preferences saved locally

### 📱 Responsive & Accessible
- **Mobile Optimized**: Perfect on all devices
- **Touch Friendly**: Optimized for touch interactions
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Kommo account with API access
- Docker (for containerized deployment)

### Local Development

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
   # Backend
   cd backend
   npm install
   npm start
   
   # Frontend (new terminal)
   cd kommo-pulse-main
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:3000`

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** for beautiful components
- **Zustand** for state management
- **React Query** for data fetching and caching

### Backend Stack
- **Node.js** with Express.js
- **SQLite** for data persistence
- **JWT** for authentication
- **Stripe** for payment processing
- **Kommo API** integration
- **Rate limiting** and security middleware

### Key Features Implementation

#### Caching System
```typescript
// Browser-based caching with localStorage
const kommoCache = new KommoCache();
const cachedData = kommoCache.get(account);
if (cachedData) {
  // Use cached data instantly
} else {
  // Fetch from API and cache
  kommoCache.set(account, data);
}
```

#### Report Generation
```typescript
// Generate reports with real Kommo data
const reportData = await generatePerformanceSummary(userId, repId, startDate, endDate);
const pdfBlob = generatePDF(reportData);
```

#### Authentication
```typescript
// JWT-based authentication
const { isAuthenticated, user, tokens } = useAuthStore();
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
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

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=Kommo Pulse
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

## 📊 Data Sources & Integration

### Kommo API Integration
- **Real-time Data**: Live metrics from Kommo CRM
- **Lead Analytics**: Conversion rates, cycle times, deal sizes
- **Task Management**: Completion rates, overdue tasks
- **Communication Metrics**: Messages, emails, SMS tracking
- **Activity Data**: User activity heatmaps
- **Sales Funnel**: Pipeline performance metrics
- **Lead Sources**: Source distribution and performance

### Caching Strategy
- **Browser Storage**: localStorage for client-side caching
- **Cache Duration**: 1 hour with automatic expiration
- **Cache Invalidation**: Manual refresh option
- **Performance**: 90%+ reduction in API calls

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

## 🎯 Usage Guide

### Dashboard Features

#### Theme Management
- Click theme toggle in top-right corner
- Choose Light, Dark, or System themes
- Settings persist across sessions

#### Caching Management
- View cache age in Reports section
- Click "Refresh" to clear cache
- Automatic cache expiration after 1 hour

#### Report Generation
1. Navigate to Reports section
2. Select report type (Performance, Activity, etc.)
3. Choose time range and format
4. Click "Generate Report"
5. Download PDF/CSV/Excel file

#### Dashboard Customization
- Click settings gear icon
- Toggle component visibility
- Change layout (grid/list)
- Configure auto-refresh settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kommo](https://kommo.com/) for the CRM platform
- [Shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Chart.js](https://www.chartjs.org/) for the chart components
- [Railway](https://railway.app/) for easy deployment
- [Stripe](https://stripe.com/) for payment processing

## 📞 Support

For support, create an issue in this repository or contact the development team.

---

**Made with ❤️ for better CRM analytics and productivity**
MASAAF Badr Eddine
