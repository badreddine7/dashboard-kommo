import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  CreditCard
} from 'lucide-react';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import ActivityHeatmap from './ActivityHeatmap';
import UserSelector from './UserSelector';
import BarChart from './charts/BarChart';
import DoughnutChart from './charts/DoughnutChart';
import LineChart from './charts/LineChart';
import { ThemeToggle } from './ui/theme-toggle';
import { DashboardSettings } from './DashboardSettings';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { PerformanceInsights } from './PerformanceInsights';
import { LeadSourceAnalysis } from './LeadSourceAnalysis';
import { RealTimeNotifications } from './RealTimeNotifications';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDashboard } from '../contexts/DashboardContext';
import { Button } from './ui/button';
import UsageTracker from './UsageTracker';
import CallsCard from './CallsCard';
import PerformanceInsightsCard from './PerformanceInsightsCard';
import ReportsSection from './ReportsSection';
import { UpgradePrompt } from './UpgradePrompt';

interface DashboardProps {
  account: string;
}

const Dashboard: React.FC<DashboardProps> = ({ account }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription, api, subscription } = useAuthStore();
  const { repId } = useParams<{ repId: string }>();
  const location = useLocation();
  const accountFromState = location.state?.account;
  
  // Use the account prop directly since we ensure it's updated in the user profile
  const accountToUse = account || accountFromState || user?.kommo_account || '';
  const { data, loading, error, refetch } = useAnalytics(accountToUse);
  const { settings } = useDashboard();
  const [selectedUser, setSelectedUser] = useState<string>(repId || '');

  // Auto-sync subscription status when component mounts
  useEffect(() => {
    const autoSyncSubscription = async () => {
      if (subscription?.stripe_subscription_id) {
        try {
          console.log('🔄 Auto-syncing subscription status for dashboard...');
          
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

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    plan: string;
    upgraded: boolean;
    welcome: boolean;
  } | null>(null);

  // Debug logging for payment success state
  useEffect(() => {
    console.log('🔍 Payment success state:', { showPaymentSuccess, paymentDetails });
  }, [showPaymentSuccess, paymentDetails]);

  // Check for payment success parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const plan = urlParams.get('plan');
    const upgraded = urlParams.get('upgraded');
    const welcome = urlParams.get('welcome');

    if (payment === 'success' && plan && upgraded === 'true') {
      console.log('🎉 Payment success detected:', { payment, plan, upgraded, welcome });
      
      setShowPaymentSuccess(true);
      setPaymentDetails({
        plan: plan.toUpperCase(),
        upgraded: true,
        welcome: welcome === 'true'
      });

      // Refresh subscription data after successful payment
      refreshSubscription();

      // Remove the payment parameters from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment');
      newUrl.searchParams.delete('plan');
      newUrl.searchParams.delete('upgraded');
      newUrl.searchParams.delete('welcome');
      window.history.replaceState({}, '', newUrl.toString());
      
      console.log('✅ Payment success message set and URL cleaned');
    }
  }, [refreshSubscription]);

  // Auto refresh functionality
  useEffect(() => {
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, refetch]);

  // Refresh subscription on mount
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);





  // Special success view for payment completion
  if (showPaymentSuccess && paymentDetails) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-card shadow-elegant border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Payment Successful
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome to {paymentDetails.plan} - Your account has been upgraded
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Card */}
          <div className="bg-gradient-card shadow-elegant border border-border rounded-xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                🎉 Welcome to {paymentDetails.plan}!
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your payment was successful and your account has been upgraded. 
                You now have access to all premium features and enhanced analytics.
              </p>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Payment Confirmed</h3>
                <p className="text-sm text-muted-foreground">Your payment has been processed successfully</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Account Upgraded</h3>
                <p className="text-sm text-muted-foreground">You now have access to premium features</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Analytics Active</h3>
                <p className="text-sm text-muted-foreground">Enhanced reporting is now available</p>
              </div>
            </div>

            {/* What's New Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-6 text-center">
                What's New with {paymentDetails.plan}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Advanced Analytics</h4>
                      <p className="text-sm text-muted-foreground">Get deeper insights into your sales performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Real-time Reports</h4>
                      <p className="text-sm text-muted-foreground">Monitor your team's performance in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Custom Dashboards</h4>
                      <p className="text-sm text-muted-foreground">Create personalized views for your team</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Priority Support</h4>
                      <p className="text-sm text-muted-foreground">Get faster response times from our support team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Export Capabilities</h4>
                      <p className="text-sm text-muted-foreground">Download reports and data for external analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">API Access</h4>
                      <p className="text-sm text-muted-foreground">Integrate with your existing tools and workflows</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => {
                  setShowPaymentSuccess(false);
                  setPaymentDetails(null);
                  // Clean URL
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.delete('payment');
                  newUrl.searchParams.delete('plan');
                  newUrl.searchParams.delete('upgraded');
                  newUrl.searchParams.delete('welcome');
                  window.history.replaceState({}, '', newUrl.toString());
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/billing')}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Manage Billing
              </Button>
            </div>
          </div>

          {/* Quick Stats Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-card shadow-elegant border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">Team Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground">Monitor your entire team's performance with advanced metrics and insights.</p>
            </div>
            <div className="bg-gradient-card shadow-elegant border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground">Performance Tracking</h3>
              </div>
              <p className="text-sm text-muted-foreground">Track conversion rates, cycle times, and win rates with detailed analytics.</p>
            </div>
            <div className="bg-gradient-card shadow-elegant border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground">Growth Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground">Identify trends and opportunities to optimize your sales process.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's a subscription-related error
    const isSubscriptionError = error.includes('expired') || 
                               error.includes('cancelled') || 
                               error.includes('Access denied') || 
                               error.includes('subscription') ||
                               error.includes('upgrade');

    if (isSubscriptionError) {
      return (
        <UpgradePrompt 
          error={error}
          currentPlan={user?.subscription?.plan_type}
          onRetry={refetch}
        />
      );
    }

    // For other errors, show the original error message
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Error loading data</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data || !data.reps.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  // Set default user if not selected
  if (!selectedUser && data.reps.length > 0) {
    setSelectedUser(data.reps[0].user_id);
  }

  const currentUser = data.reps.find(rep => rep.user_id === selectedUser) || data.reps[0];

  // Chart data preparations
  const stageLabels = Object.keys(currentUser.leads_by_stage);
  const stageData = Object.values(currentUser.leads_by_stage);

  const funnelData = {
    labels: ['Total Leads', 'SQL Leads', 'Appointments', 'Attended', 'Won'],
    datasets: [{
      label: 'Sales Funnel',
      data: [
        currentUser.total_leads,
        currentUser.sales_funnel.sql_leads,
        currentUser.sales_funnel.appointments,
        currentUser.sales_funnel.attended,
        currentUser.won_leads
      ],
      backgroundColor: 'hsl(142 70% 45%)',
      borderColor: 'hsl(142 80% 55%)',
      borderWidth: 1
    }]
  };

  const stageTimeLabels = Object.keys(currentUser.stage_time_stats.average_days_per_stage);
  const stageTimeData = {
    labels: stageTimeLabels,
    datasets: [{
      label: 'Average Days',
      data: Object.values(currentUser.stage_time_stats.average_days_per_stage),
      backgroundColor: 'hsl(142 70% 45%)',
      borderColor: 'hsl(142 80% 55%)',
      borderWidth: 1
    }, {
      label: 'Median Days',
      data: Object.values(currentUser.stage_time_stats.median_days_per_stage),
      backgroundColor: 'hsl(271 89% 58%)',
      borderColor: 'hsl(271 89% 68%)',
      borderWidth: 1
    }]
  };

  const communicationData = {
    labels: ['Messages', 'Emails', 'SMS'],
    datasets: [{
      data: [
        currentUser.messages.messages,
        currentUser.messages.emails,
        currentUser.messages.sms
      ],
      backgroundColor: [
        'hsl(142 70% 45%)',
        'hsl(271 89% 58%)',
        'hsl(45 93% 58%)'
      ],
      borderWidth: 0
    }]
  };

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
                onClick={() => navigate('/team')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Sales Rep Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Performance insights for {selectedUser ? `Sales Rep ${selectedUser}` : 'selected representative'}
                </p>
                {settings.autoRefresh && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-refreshing every {settings.refreshInterval / 60} minutes
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">



              <DashboardSettings />
              <ThemeToggle />
              {data?.reps && (
                <UserSelector 
                  users={data.reps}
                  selectedUser={selectedUser}
                  onUserChange={setSelectedUser}
                />
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

            {/* Payment Success Message */}
      {showPaymentSuccess && paymentDetails && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-green-800 font-bold text-lg">
                    🎉 Welcome to {paymentDetails.plan}!
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Your payment was successful and your account has been upgraded. 
                    You now have access to all premium features and enhanced analytics.
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Payment Confirmed
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Account Upgraded
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Premium Features Active
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Real-time Notifications */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RealTimeNotifications userData={currentUser} />
          </div>
          <div>
            <PerformanceInsights userData={currentUser} />
          </div>
        </section>

        {/* Usage Tracker, Calls Card, and Performance Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <div className="lg:col-span-1">
            <UsageTracker />
          </div>
          <div className="lg:col-span-1">
            <CallsCard calls={currentUser.calls} />
          </div>
          <div className="lg:col-span-1">
            <PerformanceInsightsCard repData={currentUser} />
          </div>
        </section>

        {/* Key Metrics - Conditional Rendering */}
        {settings.showMetrics && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            <MetricCard
              title="Total Leads"
              value={currentUser.total_leads.toLocaleString()}
              icon={Users}
              variant="accent"
              trend={{
                value: Math.round(currentUser.incoming_leads.total * 5), // Mock trend
                label: "vs last month"
              }}
              tooltip="The total number of leads assigned to this user in the last 1 month. This includes leads in all stages of the sales pipeline, from initial contact to closed deals. To improve this metric in Kommo: ensure leads are properly assigned to responsible users, regularly update lead status, and maintain accurate contact information."
            />
            <MetricCard
              title="Win Rate"
              value={`${(currentUser.win_rate * 100).toFixed(1)}%`}
              icon={Target}
              variant="success"
              subtitle={`${currentUser.won_leads} won / ${currentUser.lost_leads} lost`}
              tooltip="The percentage of leads that were successfully closed as won deals in the last 1 month. Calculated as: (Won Leads ÷ Total Leads) × 100. To improve this metric in Kommo: focus on lead qualification, follow up consistently, update lead status to 'Won' (status_id: 142) when deals close, and ensure proper pipeline management."
            />
            <MetricCard
              title="Avg Cycle Time"
              value={currentUser.avg_cycle_days ? `${currentUser.avg_cycle_days.toFixed(1)} days` : 'N/A'}
              icon={Clock}
              variant="default"
              tooltip="The average time it takes for a lead to move through the entire sales pipeline from creation to closure in the last 1 month. Calculated as: (Updated Date - Created Date) for closed leads. To improve this metric in Kommo: set realistic deadlines, move leads through pipeline stages promptly, update lead status regularly, and use automation to reduce manual delays."
            />
            <MetricCard
              title="Task Completion"
              value={`${(currentUser.completion_rate * 100).toFixed(1)}%`}
              icon={CheckCircle}
              variant="warning"
              subtitle={`${currentUser.completed_tasks}/${currentUser.tasks.created} tasks`}
              tooltip="The percentage of created tasks that have been completed in the last 1 month. Calculated as: (Completed Tasks ÷ Created Tasks) × 100. To improve this metric in Kommo: mark tasks as completed when finished, set realistic due dates, prioritize tasks effectively, and use task reminders and notifications."
            />
          </section>
        )}

        {/* Charts Row 1 - Conditional Rendering */}
        {settings.showCharts && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 lg:grid-cols-2' 
              : 'grid-cols-1'
          }`}>
            {settings.showFunnel && (
              <ChartCard title="Sales Funnel" subtitle="Lead progression through pipeline">
                <BarChart 
                  data={funnelData}
                  height={300}
                />
              </ChartCard>
            )}
            
            {settings.showCharts && (
              <ChartCard title="Leads by Stage" subtitle="Distribution across pipeline stages">
                <DoughnutChart 
                  data={{
                    labels: stageLabels,
                    datasets: [{
                      data: stageData,
                      backgroundColor: [
                        'hsl(142 70% 45%)',
                        'hsl(271 89% 58%)',
                        'hsl(45 93% 58%)',
                        'hsl(0 84% 60%)',
                        'hsl(217 91% 60%)',
                        'hsl(142 80% 55%)'
                      ]
                    }]
                  }}
                  size={250}
                />
              </ChartCard>
            )}
          </section>
        )}

        {/* Performance Metrics - Conditional Rendering */}
        {settings.showMetrics && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 md:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            <MetricCard
              title="Average Deal Size"
              value={currentUser.avg_deal_size ? `$${currentUser.avg_deal_size.toLocaleString()}` : 'N/A'}
              icon={DollarSign}
              variant="success"
              tooltip="The average monetary value of successfully closed deals in the last 1 month. Calculated from custom fields with 'Budget' or 'Value' in the name for won leads. To improve this metric in Kommo: create custom fields for deal value/budget, ensure they're filled for all leads, focus on high-value prospects, and track deal values consistently."
            />
            <MetricCard
              title="Activities"
              value={currentUser.events_count.toLocaleString()}
              icon={BarChart3}
              variant="accent"
              tooltip="The total number of activities performed by this user in the CRM over the last 30 days. Activities include calls, emails, notes, status updates, and other interactions. To improve this metric in Kommo: log all customer interactions, create notes for important conversations, update lead status when changes occur, and use the activity feed to track all touchpoints."
            />
            <MetricCard
              title="Communication"
              value={currentUser.messages.messages + currentUser.messages.emails + currentUser.messages.sms}
              icon={MessageSquare}
              variant="default"
              subtitle="Total messages sent"
              tooltip="The combined total of all outgoing communications including chat messages, emails, and SMS in the last 1 month. To improve this metric in Kommo: send follow-up emails after calls, use chat for quick responses, send SMS for urgent matters, and ensure all communications are logged in the CRM for tracking."
            />
          </section>
        )}

        {/* Task Management Metrics - Conditional Rendering */}
        {settings.showMetrics && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 md:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            <MetricCard
              title="Tasks Created"
              value={currentUser.tasks.created.toLocaleString()}
              icon={ListTodo}
              variant="accent"
              subtitle="Total tasks created"
              tooltip="The total number of tasks created by or assigned to this user in the last 1 month. This shows the user's activity level in planning and organizing their work. To improve this metric in Kommo: create tasks for all follow-up activities, set specific due dates, assign tasks to appropriate team members, and use task templates for common activities."
            />
            <MetricCard
              title="Tasks Completed"
              value={currentUser.tasks.completed.toLocaleString()}
              icon={CheckCircle}
              variant="success"
              subtitle={`${currentUser.tasks.created > 0 ? ((currentUser.tasks.completed / currentUser.tasks.created) * 100).toFixed(1) : '0'}% completion rate`}
              tooltip="The number of tasks that have been marked as completed in the last 1 month. A high completion rate indicates good follow-through and task management skills. To improve this metric in Kommo: mark tasks as completed when finished, review task list regularly, prioritize important tasks, and use task status updates to track progress."
            />
            <MetricCard
              title="Overdue Tasks"
              value={currentUser.tasks.overdue.toLocaleString()}
              icon={AlertTriangle}
              variant="warning"
              subtitle="Tasks past due date"
              tooltip="Tasks that have passed their due date without being completed in the last 1 month. High numbers may indicate workload management issues or unrealistic deadlines. To improve this metric in Kommo: set realistic due dates, prioritize urgent tasks, reschedule tasks when needed, and regularly review overdue task lists."
            />
          </section>
        )}

        {/* Data Quality Metrics - Conditional Rendering */}
        {settings.showMetrics && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1'
          }`}>
            <MetricCard
              title="Incomplete Leads"
              value={currentUser.rep_fields_stats.incomplete_leads_count.toLocaleString()}
              icon={FileText}
              variant="warning"
              subtitle="Leads with missing required fields"
              tooltip="Number of leads that are missing required custom field data for their current pipeline stage in the last 1 month. Complete data is essential for accurate reporting and lead qualification. To improve this metric in Kommo: configure required fields for each pipeline stage, ensure team members fill all required fields, use field validation, and regularly audit lead data quality."
            />
            <MetricCard
              title="Missing Fields"
              value={currentUser.rep_fields_stats.incomplete_fields.toLocaleString()}
              icon={AlertTriangle}
              variant="destructive"
              subtitle="Total required fields not filled"
              tooltip="The total count of individual required fields that are missing data across all leads in the last 1 month. Reducing this number improves data quality and reporting accuracy. To improve this metric in Kommo: identify which fields are most commonly missing, provide training on field importance, use automation to pre-fill fields where possible, and implement mandatory field requirements."
            />
          </section>
        )}

        {/* Charts Row 2 - Conditional Rendering */}
        {settings.showStageAnalysis && (
          <section className={`grid gap-6 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 lg:grid-cols-2' 
              : 'grid-cols-1'
          }`}>
            <ChartCard title="Stage Duration Analysis" subtitle="Average and median time per stage">
              <BarChart 
                data={stageTimeData}
                height={300}
              />
            </ChartCard>
            
            {settings.showCommunication && (
              <ChartCard title="Communication Breakdown" subtitle="Messages, emails, and SMS">
                <DoughnutChart 
                  data={communicationData}
                  size={250}
                />
              </ChartCard>
            )}
          </section>
        )}

        {/* Activity Heatmap - Conditional Rendering */}
        {settings.showHeatmap && (
          <section>
            <ChartCard title="Activity Heatmap" subtitle="Daily activity over the last 7 days">
              <ActivityHeatmap data={currentUser.heatmap} />
            </ChartCard>
          </section>
        )}

        {/* Lead Source Analysis */}
        <section>
          <LeadSourceAnalysis incomingLeads={currentUser.incoming_leads} />
        </section>

        {/* Sales Funnel Details - Conditional Rendering */}
        {settings.showFunnel && (
          <section className={`grid gap-4 ${
            settings.layout === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            <MetricCard
              title="SQL Rate"
              value={`${(currentUser.sales_funnel.sql_rate * 100).toFixed(1)}%`}
              icon={Target}
              variant="success"
              subtitle={`${currentUser.sales_funnel.sql_leads} SQL leads`}
              tooltip="Sales Qualified Lead rate - the percentage of leads that have been qualified as having genuine sales potential in the last 1 month. Calculated as: (SQL Leads ÷ (Total Leads - Unreachable - Not SQL)) × 100. To improve this metric in Kommo: use the 'SQL' tag for qualified leads, mark leads as 'Unreachable' or 'Not SQL' when appropriate, implement proper lead scoring, and train team on qualification criteria."
            />
            <MetricCard
              title="Appointment Rate"
              value={`${(currentUser.sales_funnel.appointment_rate * 100).toFixed(1)}%`}
              icon={Calendar}
              variant="accent"
              subtitle={`${currentUser.sales_funnel.appointments} scheduled`}
              tooltip="The percentage of SQL leads that resulted in scheduled appointments or meetings in the last 1 month. Calculated as: (Scheduled Appointments ÷ SQL Leads) × 100. To improve this metric in Kommo: create meeting tasks (task_type_id: 2) for SQL leads, ensure proper follow-up scheduling, use calendar integration, and track appointment outcomes consistently."
            />
            <MetricCard
              title="Attendance Rate"
              value={`${(currentUser.sales_funnel.attendance_rate * 100).toFixed(1)}%`}
              icon={CheckCircle}
              variant="warning"
              subtitle={`${currentUser.sales_funnel.attended} attended`}
              tooltip="The percentage of scheduled appointments that were actually attended by the prospect in the last 1 month. Calculated as: (Attended Appointments ÷ Scheduled Appointments) × 100. To improve this metric in Kommo: send appointment reminders, confirm meetings in advance, reschedule when needed, and mark meeting tasks as completed when attended."
            />
            <MetricCard
              title="Sale Rate"
              value={`${(currentUser.sales_funnel.sale_rate * 100).toFixed(1)}%`}
              icon={TrendingUp}
              variant="success"
              tooltip="The percentage of attended appointments that resulted in closed-won deals in the last 1 month. Calculated as: (Won Deals ÷ Attended Appointments) × 100. To improve this metric in Kommo: focus on closing techniques, prepare thoroughly for meetings, follow up after appointments, and ensure leads are moved to 'Won' status (status_id: 142) when deals close."
            />
            <MetricCard
              title="Pipeline Health"
              value={`${(currentUser.sales_funnel.overall_funnel_rate * 100).toFixed(1)}%`}
              icon={PieChart}
              variant="accent"
              tooltip="The overall conversion rate from total leads to closed-won deals in the last 1 month. Calculated as: (Won Deals ÷ Total Leads) × 100. This metric provides a holistic view of the entire sales process efficiency from start to finish. To improve this metric in Kommo: optimize each stage of the sales funnel, improve lead quality, enhance follow-up processes, and ensure consistent pipeline management practices."
            />
          </section>
        )}

        {/* Reports Section - At the bottom */}
        <section className="mt-12">
          <ReportsSection repData={currentUser} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;