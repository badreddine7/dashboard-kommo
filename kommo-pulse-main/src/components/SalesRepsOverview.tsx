import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign, 
  Users,
  CheckCircle,
  BarChart3,
  MessageSquare,
  Calendar,
  ArrowRight,
  Crown,
  Medal,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RepData {
  user_id: string;
  name: string;
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  win_rate: number;
  avg_cycle_days: number | null;
  completed_tasks: number;
  completion_rate: number;
  avg_deal_size: number | null;
  events_count: number;
  messages: {
    messages: number;
    emails: number;
    sms: number;
  };
  sales_funnel: {
    sql_leads: number;
    sql_rate: number;
    appointments: number;
    appointment_rate: number;
    attended: number;
    attendance_rate: number;
    sale_rate: number;
    overall_funnel_rate: number;
  };
  tasks: {
    created: number;
    completed: number;
    overdue: number;
  };
  rep_fields_stats: {
    incomplete_leads_count: number;
    incomplete_fields: number;
  };
}

interface SalesRepsOverviewProps {
  account: string;
  reps: RepData[];
  onSelectRep: (userId: string) => void;
  onBack: () => void;
}

interface LeaderboardItemProps {
  rep: RepData;
  rank: number;
  metric: string;
  value: string | number;
  subtitle?: string;
  onSelect: () => void;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ 
  rep, 
  rank, 
  metric, 
  value, 
  subtitle, 
  onSelect 
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card 
      className={`transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer ${
        rank <= 3 ? 'bg-gradient-card shadow-elegant border-border/50' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10">
              {getRankIcon(rank)}
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{rep.name}</h3>
              <p className="text-sm text-muted-foreground">{metric}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-card-foreground">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            <Badge variant={getRankBadgeVariant(rank)} className="mt-1">
              Rank #{rank}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricLeaderboardProps {
  title: string;
  icon: React.ComponentType<any>;
  reps: RepData[];
  getMetricValue: (rep: RepData) => number;
  formatValue: (value: number) => string;
  getSubtitle?: (rep: RepData) => string;
  tooltip?: string;
  onSelectRep: (userId: string) => void;
}

const MetricLeaderboard: React.FC<MetricLeaderboardProps> = ({
  title,
  icon: Icon,
  reps,
  getMetricValue,
  formatValue,
  getSubtitle,
  tooltip,
  onSelectRep
}) => {
  const sortedReps = [...reps]
    .sort((a, b) => getMetricValue(b) - getMetricValue(a))
    .slice(0, 5); // Top 5

  const leaderboardContent = (
    <Card className="bg-gradient-card shadow-elegant border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <Trophy className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedReps.map((rep, index) => (
          <LeaderboardItem
            key={rep.user_id}
            rep={rep}
            rank={index + 1}
            metric={title}
            value={formatValue(getMetricValue(rep))}
            subtitle={getSubtitle?.(rep)}
            onSelect={() => onSelectRep(rep.user_id)}
          />
        ))}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {leaderboardContent}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return leaderboardContent;
};

const SalesRepsOverview: React.FC<SalesRepsOverviewProps> = ({ 
  account, 
  reps, 
  onSelectRep, 
  onBack 
}) => {
  if (!reps || reps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Sales Reps Found</h2>
            <p className="text-muted-foreground">No data available for this account.</p>
            <Button onClick={onBack} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall stats
  const totalLeads = reps.reduce((sum, rep) => sum + rep.total_leads, 0);
  const totalWon = reps.reduce((sum, rep) => sum + rep.won_leads, 0);
  const totalActivities = reps.reduce((sum, rep) => sum + rep.events_count, 0);
  const avgWinRate = reps.reduce((sum, rep) => sum + rep.win_rate, 0) / reps.length;

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
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Sales Team Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                  Performance rankings for {account} • {reps.length} sales reps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-accent shadow-glow border-accent/20">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-accent-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent-foreground">{reps.length}</div>
              <p className="text-sm text-accent-foreground/80">Sales Reps</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-success shadow-glow border-success/20">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-success-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold text-success-foreground">
                {(avgWinRate * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-success-foreground/80">Avg Win Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {totalLeads.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {totalActivities.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Activities</p>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Leaderboards */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-card-foreground">Performance Leaderboards</h2>
            <p className="text-muted-foreground ml-2">Click on any rep to view their detailed dashboard</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Win Rate Leaderboard */}
            <MetricLeaderboard
              title="Win Rate Champions"
              icon={Target}
              reps={reps}
              getMetricValue={(rep) => rep.win_rate}
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
              getSubtitle={(rep) => `${rep.won_leads} won / ${rep.total_leads} total`}
              tooltip="Ranked by the percentage of leads successfully closed as won deals"
              onSelectRep={onSelectRep}
            />

            {/* Total Leads Leaderboard */}
            <MetricLeaderboard
              title="Lead Volume Leaders"
              icon={Users}
              reps={reps}
              getMetricValue={(rep) => rep.total_leads}
              formatValue={(value) => value.toLocaleString()}
              getSubtitle={(rep) => `${rep.won_leads} won`}
              tooltip="Ranked by total number of leads managed"
              onSelectRep={onSelectRep}
            />

            {/* Deal Size Leaderboard */}
            <MetricLeaderboard
              title="Deal Size Masters"
              icon={DollarSign}
              reps={reps.filter(rep => rep.avg_deal_size && rep.avg_deal_size > 0)}
              getMetricValue={(rep) => rep.avg_deal_size || 0}
              formatValue={(value) => `$${value.toLocaleString()}`}
              getSubtitle={(rep) => `${rep.won_leads} deals closed`}
              tooltip="Ranked by average monetary value of closed deals"
              onSelectRep={onSelectRep}
            />

            {/* Activity Leaders */}
            <MetricLeaderboard
              title="Activity Powerhouses"
              icon={BarChart3}
              reps={reps}
              getMetricValue={(rep) => rep.events_count}
              formatValue={(value) => value.toLocaleString()}
              getSubtitle={(rep) => "activities (90 days)"}
              tooltip="Ranked by total CRM activities over the last 90 days"
              onSelectRep={onSelectRep}
            />

            {/* Task Completion Leaders */}
            <MetricLeaderboard
              title="Task Completion Pros"
              icon={CheckCircle}
              reps={reps}
              getMetricValue={(rep) => rep.completion_rate}
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
              getSubtitle={(rep) => `${rep.tasks.completed}/${rep.tasks.created} tasks`}
              tooltip="Ranked by percentage of created tasks that were completed"
              onSelectRep={onSelectRep}
            />

            {/* Communication Leaders */}
            <MetricLeaderboard
              title="Communication Champions"
              icon={MessageSquare}
              reps={reps}
              getMetricValue={(rep) => rep.messages.messages + rep.messages.emails + rep.messages.sms}
              formatValue={(value) => value.toLocaleString()}
              getSubtitle={(rep) => "total messages sent"}
              tooltip="Ranked by total outgoing communications (messages, emails, SMS)"
              onSelectRep={onSelectRep}
            />

            {/* SQL Rate Leaders */}
            <MetricLeaderboard
              title="Qualification Experts"
              icon={Target}
              reps={reps}
              getMetricValue={(rep) => rep.sales_funnel.sql_rate}
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
              getSubtitle={(rep) => `${rep.sales_funnel.sql_leads} SQL leads`}
              tooltip="Ranked by Sales Qualified Lead rate - percentage of leads qualified as sales-ready"
              onSelectRep={onSelectRep}
            />

            {/* Appointment Rate Leaders */}
            <MetricLeaderboard
              title="Meeting Schedulers"
              icon={Calendar}
              reps={reps}
              getMetricValue={(rep) => rep.sales_funnel.appointment_rate}
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
              getSubtitle={(rep) => `${rep.sales_funnel.appointments} scheduled`}
              tooltip="Ranked by percentage of SQL leads that resulted in scheduled appointments"
              onSelectRep={onSelectRep}
            />

            {/* Pipeline Efficiency Leaders */}
            <MetricLeaderboard
              title="Pipeline Efficiency Stars"
              icon={TrendingUp}
              reps={reps}
              getMetricValue={(rep) => rep.sales_funnel.overall_funnel_rate}
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
              getSubtitle={(rep) => "overall conversion"}
              tooltip="Ranked by overall conversion rate from total leads to closed-won deals"
              onSelectRep={onSelectRep}
            />
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-12 text-center">
          <Card className="bg-gradient-accent shadow-glow border-accent/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Trophy className="h-12 w-12 text-accent-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-accent-foreground mb-2">
                Ready to Dive Deeper?
              </h3>
              <p className="text-accent-foreground/80 mb-4">
                Click on any sales rep above to view their detailed performance dashboard with comprehensive analytics, charts, and insights.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default SalesRepsOverview;
