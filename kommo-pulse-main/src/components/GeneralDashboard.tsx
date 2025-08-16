import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Users,
  ArrowLeft,
  ListTodo,
  AlertTriangle,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  CreditCard,
  Trophy,
  Medal,
  Star,
  Crown,
  TrendingDown,
  Activity,
  Zap,
  Award,
  Target as TargetIcon,
  UserCheck,
  UserX,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { ThemeToggle } from './ui/theme-toggle';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDashboard } from '../contexts/DashboardContext';
import UsageTracker from './UsageTracker';
import { UpgradePrompt } from './UpgradePrompt';
import DoughnutChart from './charts/DoughnutChart';
import LineChart from './charts/LineChart';

interface GeneralDashboardProps {
  account: string;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  performance: {
    deals_closed: number;
    total_revenue: number;
    avg_deal_size: number;
    conversion_rate: number;
    activities_count: number;
    tasks_completed: number;
    response_time: number;
    lead_quality_score: number;
  };
  ranking: number;
  trend: 'up' | 'down' | 'stable';
  status: 'active' | 'inactive' | 'on_leave';
  last_activity: string;
}

const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ account }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription, api, subscription } = useAuthStore();
  const accountToUse = account || user?.kommo_account || '';
  const { data, loading, error, refetch } = useAnalytics(accountToUse);
  const { settings } = useDashboard();
  
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [sortBy, setSortBy] = useState<'revenue' | 'deals' | 'conversion' | 'activity'>('revenue');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Auto-sync subscription status when component mounts
  useEffect(() => {
    const autoSyncSubscription = async () => {
      if (subscription?.stripe_subscription_id) {
        try {
          console.log('🔄 Auto-syncing subscription status for general dashboard...');
          
          // Call the sync endpoint
          const response = await api.post('/stripe/sync-subscription', {
            subscriptionId: subscription.stripe_subscription_id
          });
          
          if (response.data.success) {
            console.log('✅ Subscription auto-synced successfully');
            
            // Refresh subscription data
            await refreshSubscription();
          } else {
            console.warn('⚠️ Subscription auto-sync failed:', response.data.message);
          }
        } catch (error: any) {
          console.error('❌ Error auto-syncing subscription:', error);
          // Don't show error to user, just log it
        }
      }
    };

    autoSyncSubscription();
  }, [subscription?.stripe_subscription_id, api, refreshSubscription]);

  // Mock data for demonstration - in real app this would come from the API
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRevenue: 0,
    totalDeals: 0,
    avgConversionRate: 0,
    totalActivities: 0,
    topPerformer: '',
    mostImproved: '',
    teamGrowth: 0
  });

  useEffect(() => {
    if (data?.reps) {
      // Transform the real data from aggregate function into our SalesRep format
      const transformedReps: SalesRep[] = data.reps.map((rep: any, index: number) => {
        // Calculate total revenue from won leads and average deal size
        const totalRevenue = (rep.won_leads || 0) * (rep.avg_deal_size || 0);
        
        // Calculate total activities from events and messages
        const totalActivities = (rep.events_count || 0) + 
                               (rep.messages?.messages || 0) + 
                               (rep.messages?.emails || 0) + 
                               (rep.messages?.sms || 0) +
                               (rep.notes_stats?.total || 0);

        // Determine trend based on win rate and performance
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (rep.win_rate > 0.6) trend = 'up';
        else if (rep.win_rate < 0.3) trend = 'down';

                 // Calculate last activity from heatmap data (most recent activity)
         let lastActivity = new Date().toISOString(); // fallback
         if (rep.heatmap && Object.keys(rep.heatmap).length > 0) {
           // Get the most recent date from heatmap
           const activityDates = Object.keys(rep.heatmap);
           if (activityDates.length > 0) {
             const mostRecentDate = activityDates.sort().pop(); // Get the latest date
             if (mostRecentDate) {
               lastActivity = new Date(mostRecentDate).toISOString();
             }
           }
         }

         return {
           id: rep.user_id || `rep-${index}`,
           name: rep.name || `Sales Rep ${index + 1}`,
           email: `rep${index + 1}@company.com`, // Email not provided by Kommo API
           avatar: rep.avatar,
           performance: {
             deals_closed: rep.won_leads || 0,
             total_revenue: totalRevenue,
             avg_deal_size: rep.avg_deal_size || 0,
             conversion_rate: rep.win_rate || 0,
             activities_count: totalActivities,
             tasks_completed: rep.completed_tasks || 0,
             response_time: rep.avg_cycle_days || 0,
             lead_quality_score: rep.win_rate || 0
           },
           ranking: index + 1,
           trend: trend,
           status: 'active' as const,
           last_activity: lastActivity
         };
      });

      // Sort by selected criteria
      const sortedReps = [...transformedReps].sort((a, b) => {
        switch (sortBy) {
          case 'revenue':
            return b.performance.total_revenue - a.performance.total_revenue;
          case 'deals':
            return b.performance.deals_closed - a.performance.deals_closed;
          case 'conversion':
            return b.performance.conversion_rate - a.performance.conversion_rate;
          case 'activity':
            return b.performance.activities_count - a.performance.activities_count;
          default:
            return 0;
        }
      });

      // Update rankings after sorting
      const rankedReps = sortedReps.map((rep, index) => ({
        ...rep,
        ranking: index + 1
      }));

      setSalesReps(rankedReps);

      // Calculate overall stats from real data
      const totalRevenue = rankedReps.reduce((sum, rep) => sum + rep.performance.total_revenue, 0);
      const totalDeals = rankedReps.reduce((sum, rep) => sum + rep.performance.deals_closed, 0);
      const avgConversionRate = rankedReps.length > 0 
        ? rankedReps.reduce((sum, rep) => sum + rep.performance.conversion_rate, 0) / rankedReps.length 
        : 0;
      const totalActivities = rankedReps.reduce((sum, rep) => sum + rep.performance.activities_count, 0);
      const topPerformer = rankedReps[0]?.name || '';
      const mostImproved = rankedReps.find(rep => rep.trend === 'up')?.name || rankedReps[0]?.name || '';

      // Calculate team growth based on total leads vs won leads
      const totalLeads = data.reps.reduce((sum: number, rep: any) => sum + (rep.total_leads || 0), 0);
      const totalWonLeads = data.reps.reduce((sum: number, rep: any) => sum + (rep.won_leads || 0), 0);
      const teamGrowth = totalLeads > 0 ? (totalWonLeads / totalLeads) * 100 : 0;

      setOverallStats({
        totalRevenue,
        totalDeals,
        avgConversionRate,
        totalActivities,
        topPerformer,
        mostImproved,
        teamGrowth: Number(teamGrowth.toFixed(1))
      });
    }
  }, [data, sortBy]);

  const handleRepClick = (repId: string) => {
    navigate(`/dashboard/${repId}`, { state: { account } });
  };

  const getRankingIcon = (ranking: number) => {
    switch (ranking) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Trophy className="h-4 w-4 text-amber-600" />;
      default:
        return <Star className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'stable':
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (error) {
    return <UpgradePrompt error={error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-card shadow-elegant border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Team Performance Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Overview of all sales representatives for {account || user?.kommo_account || 'your account'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Team Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-green-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${overallStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{overallStats.teamGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-blue-500" />
                Total Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all representatives
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Avg Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overallStats.avgConversionRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Team average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-orange-500" />
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalActivities.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Team Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-card shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Team Highlights
              </CardTitle>
              <CardDescription>
                Key insights and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">Top Performer</p>
                    <p className="text-xs text-muted-foreground">{overallStats.topPerformer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Most Improved</p>
                    <p className="text-xs text-muted-foreground">{overallStats.mostImproved}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-lg font-bold text-purple-600">{salesReps.length}</div>
                  <p className="text-xs text-muted-foreground">Active Reps</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">
                    ${(overallStats.totalRevenue / salesReps.length).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg per Rep</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(overallStats.totalDeals / salesReps.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Performance Distribution
              </CardTitle>
              <CardDescription>
                Revenue by representative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DoughnutChart 
                data={{
                  labels: salesReps.slice(0, 5).map(rep => rep.name),
                  datasets: [{
                    data: salesReps.slice(0, 5).map(rep => rep.performance.total_revenue),
                    backgroundColor: [
                      'hsl(142 70% 45%)',
                      'hsl(271 89% 58%)',
                      'hsl(45 93% 58%)',
                      'hsl(0 84% 60%)',
                      'hsl(217 91% 60%)'
                    ]
                  }]
                }}
                size={200}
              />
            </CardContent>
          </Card>
        </section>

        {/* Controls */}
        <section className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-border rounded-md px-3 py-1 bg-background"
              >
                <option value="revenue">Revenue</option>
                <option value="deals">Deals Closed</option>
                <option value="conversion">Conversion Rate</option>
                <option value="activity">Activities</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-sm border border-border rounded-md px-3 py-1 bg-background"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {salesReps.length} Representatives
            </Badge>
          </div>
        </section>

        {/* Sales Representatives Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesReps.map((rep) => (
            <Card 
              key={rep.id} 
              className="bg-gradient-card shadow-elegant border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => handleRepClick(rep.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={rep.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {rep.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                        {rep.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{rep.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRankingIcon(rep.ranking)}
                    <span className="text-xs font-medium">#{rep.ranking}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-600">
                      ${rep.performance.total_revenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-600">
                      {rep.performance.deals_closed}
                    </div>
                    <p className="text-xs text-muted-foreground">Deals</p>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{(rep.performance.conversion_rate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={rep.performance.conversion_rate * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Deal Size</span>
                    <span className="font-medium">${rep.performance.avg_deal_size.toLocaleString()}</span>
                  </div>
                </div>

                {/* Activity & Trend */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {rep.performance.activities_count} activities
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getTrendColor(rep.trend)}`}
                  >
                    {getTrendIcon(rep.trend)}
                    {rep.trend}
                  </Badge>
                </div>

                                 {/* Last Activity */}
                 <div className="text-xs text-muted-foreground">
                   Last active: {(() => {
                     const lastActivityDate = new Date(rep.last_activity);
                     const now = new Date();
                     const diffInDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (diffInDays === 0) {
                       return 'Today';
                     } else if (diffInDays === 1) {
                       return 'Yesterday';
                     } else if (diffInDays < 7) {
                       return `${diffInDays} days ago`;
                     } else {
                       return lastActivityDate.toLocaleDateString();
                     }
                   })()}
                 </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Usage Tracker */}
        <section>
          <UsageTracker />
        </section>
      </main>
    </div>
  );
};

export default GeneralDashboard;
