# Kommo Pulse - Enhanced CRM Analytics Dashboard

A modern, customizable CRM analytics dashboard for Kommo (formerly AmoCRM) with real-time insights, dark/light mode support, and advanced features.

## ✨ Features

### 🎨 Theme Support
- **Dark/Light Mode**: Toggle between dark and light themes
- **System Theme**: Automatically follows your system preference
- **Persistent Settings**: Theme preference is saved locally
- **Smooth Transitions**: Beautiful animations between theme changes

### 🎛️ Customizable Dashboard
- **Layout Options**: Choose between grid and list layouts
- **Component Visibility**: Show/hide specific dashboard sections
- **Auto Refresh**: Configurable automatic data refresh intervals
- **Settings Persistence**: All preferences saved locally

### 📊 Enhanced Analytics
- **Real-time Notifications**: Live alerts for important metrics
- **Performance Insights**: AI-powered recommendations and analysis
- **Lead Source Analysis**: Detailed breakdown of lead sources
- **Activity Heatmap**: Visual activity tracking over time
- **Sales Funnel Analytics**: Comprehensive funnel performance metrics

### 🔄 Auto Refresh & Data Management
- **Configurable Intervals**: Set refresh intervals from 1-30 minutes
- **Manual Refresh**: One-click data refresh
- **Loading States**: Smooth loading indicators
- **Error Handling**: Graceful error recovery

### 📱 Responsive Design
- **Mobile Optimized**: Works perfectly on all devices
- **Adaptive Layout**: Components adjust to screen size
- **Touch Friendly**: Optimized for touch interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Kommo account with API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kommo-pulse-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### Dashboard Features

#### Theme Toggle
- Click the theme toggle button in the top-right corner
- Choose between Light, Dark, or System themes
- Settings are automatically saved

#### Dashboard Customization
- Click the settings gear icon to open customization panel
- Toggle component visibility
- Change layout between grid and list
- Configure auto-refresh settings

#### Real-time Notifications
- View live notifications for important events
- Mark notifications as read
- Expand/collapse notification list

#### Performance Insights
- Get AI-powered recommendations
- View performance analysis
- See actionable insights for improvement

#### Lead Source Analysis
- Analyze lead distribution by source
- View source performance metrics
- Identify top-performing sources

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** for components
- **React Query** for data fetching
- **React Router** for navigation

### Key Components

#### Context Providers
- `ThemeProvider`: Manages theme state and persistence
- `DashboardProvider`: Handles dashboard customization settings

#### Core Components
- `Dashboard`: Main dashboard with conditional rendering
- `DashboardSettings`: Customization panel
- `ThemeToggle`: Theme switching component
- `PerformanceInsights`: AI-powered recommendations
- `RealTimeNotifications`: Live notification system
- `LeadSourceAnalysis`: Lead source breakdown

#### Charts & Visualizations
- `BarChart`: Bar chart component
- `DoughnutChart`: Pie chart component
- `LineChart`: Line chart component
- `ActivityHeatmap`: Activity visualization

## 🎨 Customization

### Theme Customization
The dashboard supports extensive theme customization through CSS variables:

```css
:root {
  --primary: 142 70% 45%;
  --accent: 271 89% 58%;
  --background: 0 0% 100%;
  /* ... more variables */
}
```

### Component Visibility
Control which components are visible through the dashboard settings:

```typescript
interface DashboardSettings {
  showMetrics: boolean;
  showCharts: boolean;
  showHeatmap: boolean;
  showFunnel: boolean;
  // ... more options
}
```

### Layout Options
Choose between different layout modes:

- **Grid Layout**: Traditional card-based layout
- **List Layout**: Vertical list layout for better mobile experience

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Kommo Pulse
```

### Backend Integration
The dashboard connects to your Kommo backend API. Ensure your backend is running and accessible.

## 📊 Data Sources

The dashboard integrates with Kommo's API to provide:

- **Lead Analytics**: Conversion rates, cycle times, deal sizes
- **Task Management**: Completion rates, overdue tasks
- **Communication Metrics**: Messages, emails, SMS tracking
- **Activity Data**: User activity heatmaps
- **Sales Funnel**: Pipeline performance metrics
- **Lead Sources**: Source distribution and performance

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

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

## 📞 Support

For support, email support@example.com or create an issue in this repository.

---

**Made with ❤️ for better CRM analytics**
