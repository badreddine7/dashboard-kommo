import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PerformanceInsightsProps {
  userData: any;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ userData }) => {
  const generateInsights = () => {
    const insights = [];
    
    // Win Rate Analysis
    if (userData.win_rate < 0.3) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Low Win Rate',
        description: `Your win rate of ${(userData.win_rate * 100).toFixed(1)}% is below industry average. Consider improving lead qualification.`,
        action: 'Review lead scoring criteria'
      });
    } else if (userData.win_rate > 0.6) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Excellent Win Rate',
        description: `Your win rate of ${(userData.win_rate * 100).toFixed(1)}% is outstanding! Keep up the great work.`,
        action: 'Share best practices with team'
      });
    }

    // Cycle Time Analysis
    if (userData.avg_cycle_days && userData.avg_cycle_days > 30) {
      insights.push({
        type: 'warning',
        icon: Clock,
        title: 'Long Sales Cycle',
        description: `Average cycle time of ${userData.avg_cycle_days.toFixed(1)} days is longer than ideal.`,
        action: 'Optimize follow-up processes'
      });
    }

    // Task Completion Analysis
    if (userData.completion_rate < 0.7) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Task Completion Needs Improvement',
        description: `Task completion rate of ${(userData.completion_rate * 100).toFixed(1)}% could be higher.`,
        action: 'Set up task reminders'
      });
    }

    // SQL Rate Analysis
    if (userData.sales_funnel.sql_rate < 0.2) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: 'Low SQL Rate',
        description: `SQL rate of ${(userData.sales_funnel.sql_rate * 100).toFixed(1)}% indicates lead quality issues.`,
        action: 'Review lead sources and qualification'
      });
    }

    // Positive Insights
    if (userData.events_count > 100) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'High Activity Level',
        description: `${userData.events_count} activities show strong engagement with prospects.`,
        action: 'Maintain this momentum'
      });
    }

    if (userData.sales_funnel.attendance_rate > 0.8) {
      insights.push({
        type: 'success',
        icon: Lightbulb,
        title: 'Great Attendance Rate',
        description: `${(userData.sales_funnel.attendance_rate * 100).toFixed(1)}% attendance rate shows strong commitment.`,
        action: 'Leverage this for higher conversion'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No specific insights available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              insight.type === 'success'
                ? 'border-success/20 bg-success/5 dark:border-success/20 dark:bg-success/10'
                : 'border-warning/20 bg-warning/5 dark:border-warning/20 dark:bg-warning/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <insight.icon className={`h-5 w-5 mt-0.5 ${
                insight.type === 'success' ? 'text-success' : 'text-warning'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <Badge variant={insight.type === 'success' ? 'default' : 'secondary'}>
                    {insight.type === 'success' ? 'Positive' : 'Attention'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                <p className="text-xs font-medium text-primary">{insight.action}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
