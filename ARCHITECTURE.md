# Kommo Pulse - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kommo Pulse                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │    Backend      │    │   External   │ │
│  │   (React)       │◄──►│   (Node.js)     │◄──►│   Services   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Browser       │    │   SQLite DB     │    │   Kommo API  │ │
│  │   Cache         │    │   (Local)       │    │   Stripe     │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
dashboard-kommo/
├── backend/                          # Backend Node.js application
│   ├── routes/                       # API route handlers
│   │   ├── auth.js                   # Authentication endpoints
│   │   ├── reports.js                # Report generation
│   │   ├── usage.js                  # Usage tracking
│   │   └── stripe.js                 # Payment processing
│   ├── database.js                   # Database connection & helpers
│   ├── server.js                     # Main server file + aggregate function
│   ├── Dockerfile                    # Backend container
│   ├── railway.json                  # Railway deployment config
│   └── package.json                  # Backend dependencies
│
├── kommo-pulse-main/                 # Frontend React application
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── ReportsSection.tsx    # Report generation UI
│   │   │   ├── UsageTracker.tsx      # Usage tracking UI
│   │   │   └── ...                   # Other components
│   │   ├── hooks/                    # Custom React hooks
│   │   │   └── useAnalytics.ts       # Analytics data fetching
│   │   ├── utils/                    # Utility functions
│   │   │   └── cache.js              # Caching system
│   │   └── stores/                   # State management
│   ├── Dockerfile                    # Frontend container
│   ├── railway.json                  # Railway deployment config
│   └── package.json                  # Frontend dependencies
│
├── docker-compose.yml                # Multi-container setup
└── README.md                         # Project documentation
```

## 🔄 Data Flow Architecture

### 1. Authentication Flow
```
User Login → Frontend → Backend JWT → Kommo OAuth → User Session
     ↓
Browser Storage ← JWT Token ← User Profile ← Database
```

### 2. Analytics Data Flow
```
Frontend Request → Backend API → Kommo API → Data Processing → Response
     ↓
Browser Cache ← Cached Data ← Real-time Data ← Aggregate Function
```

### 3. Report Generation Flow
```
User Request → Frontend → Backend → Kommo Data → Report Processing → PDF/CSV
     ↓
Database ← Report Storage ← Report Metadata ← Generated Report
```

## 🏛️ Component Architecture

### Frontend Architecture (React + TypeScript)

#### State Management
```typescript
// Zustand Store Structure
interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface DashboardStore {
  settings: DashboardSettings;
  theme: 'light' | 'dark' | 'system';
  layout: 'grid' | 'list';
}
```

#### Component Hierarchy
```
App
├── ThemeProvider
├── AuthProvider
├── Dashboard
│   ├── Header
│   │   ├── ThemeToggle
│   │   └── UserMenu
│   ├── Sidebar
│   ├── Main Content
│   │   ├── MetricsSection
│   │   ├── ChartsSection
│   │   ├── ActivityHeatmap
│   │   └── ReportsSection ← Bottom of dashboard
│   └── Settings Panel
└── Modals
    ├── LoginModal
    └── SubscriptionModal
```

### Backend Architecture (Node.js + Express)

#### API Layer Structure
```javascript
// Route Organization
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── GET /profile
├── /report
│   └── GET / (Kommo analytics)
├── /reports
│   ├── POST /generate
│   ├── GET /history
│   ├── GET /stats
│   └── POST /clear-cache
├── /usage
│   └── GET / (usage statistics)
└── /stripe
    ├── POST /create-checkout
    └── POST /webhook
```

#### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  kommo_account TEXT,
  created_at DATETIME,
  subscription_status TEXT
);

-- Reports table
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  report_type TEXT,
  format TEXT,
  data TEXT,
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usage logs table
CREATE TABLE usage_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action_type TEXT,
  feature TEXT,
  metadata TEXT,
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔧 Technical Stack

### Frontend Stack
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 4.x |
| Tailwind CSS | Styling | 3.x |
| Shadcn/ui | Component Library | Latest |
| Zustand | State Management | 4.x |
| React Query | Data Fetching | 4.x |
| jsPDF | PDF Generation | 2.x |

### Backend Stack
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18.x |
| Express.js | Web Framework | 4.x |
| SQLite | Database | 3.x |
| JWT | Authentication | 9.x |
| Stripe | Payments | 12.x |
| Axios | HTTP Client | 1.x |

### DevOps Stack
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Railway | Deployment platform |
| GitHub | Version control |

## 🔄 Caching Architecture

### Multi-Level Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Browser       │    │   Backend       │                │
│  │   Cache         │    │   Cache         │                │
│  │   (1 hour)      │    │   (Optional)    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   localStorage  │    │   Memory/Redis  │                │
│  │   KommoCache    │    │   (Future)      │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login → JWT Token Generation
2. Token Storage → Browser localStorage
3. API Requests → Authorization Header
4. Token Validation → Backend Middleware
5. User Context → Request Processing
```

### Security Measures
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API abuse protection
- **CORS Configuration**: Cross-origin security
- **Input Validation**: Request sanitization
- **HTTPS Enforcement**: Production security
- **Environment Variables**: Sensitive data protection

## 📊 Data Processing Architecture

### Kommo Data Aggregation
```javascript
// Backend aggregate function (server.js)
async function aggregate(account, useCache = true) {
  // 1. Check cache if enabled
  if (useCache && cache.has(account)) {
    return cache.get(account);
  }

  // 2. Fetch from Kommo API
  const kommoData = await fetchKommoData(account);
  
  // 3. Process and transform data
  const processedData = processKommoData(kommoData);
  
  // 4. Cache processed data
  if (useCache) {
    cache.set(account, processedData);
  }
  
  return processedData;
}
```

### Report Generation Pipeline
```
1. User Request → Report Type Selection
2. Data Fetching → Kommo API + Cache
3. Data Processing → Business Logic
4. Report Generation → PDF/CSV/Excel
5. Report Storage → Database
6. Response → Download Link
```

## 🚀 Deployment Architecture

### Docker Containerization
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │   Backend       │                │
│  │   Container     │    │   Container     │                │
│  │   (Port 80)     │    │   (Port 3000)   │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                         │
│           └───────────────────────┼─────────────────────────┘
│                                   │                         │
│  ┌─────────────────────────────────┼─────────────────────────┐
│  │           Nginx Reverse Proxy   │                         │
│  │           (Port 80)             │                         │
│  └─────────────────────────────────┴─────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Railway Deployment
```
GitHub Repository
       │
       ▼
Railway Project
       │
       ▼
┌─────────────────┐    ┌─────────────────┐
│   Backend       │    │   Frontend      │
│   Service       │    │   Service       │
│   (Railway)     │    │   (Railway)     │
└─────────────────┘    └─────────────────┘
       │                       │
       ▼                       ▼
Environment Variables    Environment Variables
Database (Railway)      Domain (Railway)
```

## 🔄 API Integration Architecture

### Kommo API Integration
```
Frontend Request
       │
       ▼
Backend API Gateway
       │
       ▼
Kommo OAuth → Access Token
       │
       ▼
Kommo API Calls
├── /api/v4/leads
├── /api/v4/contacts
├── /api/v4/tasks
└── /api/v4/companies
       │
       ▼
Data Processing & Caching
       │
       ▼
Frontend Response
```

### Stripe Integration
```
Frontend Checkout
       │
       ▼
Backend Stripe API
       │
       ▼
Stripe Payment Processing
       │
       ▼
Webhook Handling
       │
       ▼
Subscription Update
```

## 📈 Performance Architecture

### Optimization Strategies
1. **Browser Caching**: 1-hour cache for Kommo data
2. **Lazy Loading**: Component-level code splitting
3. **Image Optimization**: WebP format support
4. **Bundle Optimization**: Vite build optimization
5. **Database Indexing**: SQLite performance tuning
6. **CDN Integration**: Static asset delivery

### Monitoring & Analytics
- **Performance Metrics**: Core Web Vitals
- **Error Tracking**: Console error monitoring
- **Usage Analytics**: Feature usage tracking
- **API Monitoring**: Response time tracking

## 🔧 Configuration Management

### Environment Configuration
```bash
# Backend Environment
JWT_SECRET=your-jwt-secret
CLIENT_ID=kommo-client-id
CLIENT_SECRET=kommo-client-secret
CALLBACK_URL=https://your-domain.com/callback
PORT=3000
NODE_ENV=production

# Frontend Environment
VITE_API_URL=https://your-backend-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=Kommo Pulse
```

### Feature Flags
```typescript
// Feature configuration
const FEATURES = {
  CACHING_ENABLED: true,
  CACHE_DURATION: 3600000, // 1 hour
  REPORT_GENERATION: true,
  SUBSCRIPTION_REQUIRED: false,
  ANALYTICS_ENABLED: true
};
```

This architecture provides a scalable, maintainable, and performant foundation for the Kommo Pulse CRM analytics dashboard.
