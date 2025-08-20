import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap, 
  Star,
  Award,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PerformanceInsightsCardProps {
  repData: {
    win_rate: number;
    avg_cycle_days: number | null;
    completion_rate: number;
    events_count: number;
    total_leads: number;
    won_leads: number;
    lost_leads: number;
    avg_deal_size: number | null;
    sales_funnel: {
      sql_rate: number;
      appointment_rate: number;
      attendance_rate: number;
      sale_rate: number;
      overall_funnel_rate: number;
    };
  };
}

const PerformanceInsightsCard: React.FC<PerformanceInsightsCardProps> = ({ repData }) => {
  const {
    win_rate,
    avg_cycle_days,
    completion_rate,
    events_count,
    total_leads,
    won_leads,
    lost_leads,
    avg_deal_size,
    sales_funnel
  } = repData;

  // Calculate performance scores (0-100)
  const winRateScore = Math.round(win_rate * 100);
  const completionScore = Math.round(completion_rate * 100);
  const sqlRateScore = Math.round(sales_funnel.sql_rate * 100);
  const appointmentScore = Math.round(sales_funnel.appointment_rate * 100);
  const attendanceScore = Math.round(sales_funnel.attendance_rate * 100);
  const saleRateScore = Math.round(sales_funnel.sale_rate * 100);

  // Determine overall performance grade
  const overallScore = Math.round(
    (winRateScore + completionScore + sqlRateScore + appointmentScore + attendanceScore + saleRateScore) / 6
  );

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getTrendIcon = (value: number, threshold: number = 0.5) => {
    if (value > threshold) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (value < threshold * 0.7) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Activity className="h-3 w-3 text-blue-500" />;
  };

  const performanceGrade = getPerformanceGrade(overallScore);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4 text-purple-500" />
                Performance Insights
              </CardTitle>
              <CardDescription className="text-xs">
                Key metrics and performance analysis
              </CardDescription>
            </CardHeader>
             <CardContent className="p-4 space-y-4">
         {/* Top Row: Performance Grade and Quick Stats */}
         <div className="flex items-center justify-between">
           {/* Left: Performance Grade */}
           <div className={`text-center p-3 rounded-lg border ${performanceGrade.bg} ${performanceGrade.border} min-w-[90px]`}>
             <div className={`text-3xl font-bold ${performanceGrade.color}`}>
               {performanceGrade.grade}
             </div>
             <p className="text-xs text-muted-foreground mt-1">
               {overallScore}/100
             </p>
           </div>

           {/* Right: Quick Stats */}
           <div className="text-right space-y-2">
             <div>
               <div className="text-lg font-bold text-blue-600">{total_leads}</div>
               <p className="text-xs text-muted-foreground">Total Leads</p>
             </div>
             <div>
               <div className="text-lg font-bold text-green-600">{won_leads}</div>
               <p className="text-xs text-muted-foreground">Won Deals</p>
             </div>
           </div>
         </div>

         {/* Middle Row: Key Metrics */}
         <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Win Rate</span>
               <div className="flex items-center gap-1">
                 {getTrendIcon(win_rate)}
                 <span className="font-medium text-sm">{winRateScore}%</span>
               </div>
             </div>
             
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Task Completion</span>
               <div className="flex items-center gap-1">
                 {getTrendIcon(completion_rate)}
                 <span className="font-medium text-sm">{completionScore}%</span>
               </div>
             </div>
           </div>

           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">SQL Rate</span>
               <div className="flex items-center gap-1">
                 {getTrendIcon(sales_funnel.sql_rate)}
                 <span className="font-medium text-sm">{sqlRateScore}%</span>
               </div>
             </div>

             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Appointment Rate</span>
               <div className="flex items-center gap-1">
                 {getTrendIcon(sales_funnel.appointment_rate)}
                 <span className="font-medium text-sm">{appointmentScore}%</span>
               </div>
             </div>
           </div>
         </div>

         {/* Bottom Row: Performance Badges */}
         <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
           {win_rate > 0.6 && (
             <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
               <Star className="h-2 w-2 mr-1" />
               High Performer
             </Badge>
           )}
           {completion_rate > 0.8 && (
             <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
               <CheckCircle className="h-2 w-2 mr-1" />
               Task Master
             </Badge>
           )}
           {avg_cycle_days && avg_cycle_days < 30 && (
             <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
               <Zap className="h-2 w-2 mr-1" />
               Fast Closer
             </Badge>
           )}
           {events_count > 100 && (
             <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
               <Activity className="h-2 w-2 mr-1" />
               Active
             </Badge>
           )}
           {sales_funnel.overall_funnel_rate > 0.3 && (
             <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-600 border-yellow-200">
               <Target className="h-2 w-2 mr-1" />
               Efficient
             </Badge>
           )}
           {avg_cycle_days && (
             <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
               <Clock className="h-2 w-2 mr-1" />
               {avg_cycle_days.toFixed(1)}d
             </Badge>
           )}
         </div>
       </CardContent>
        </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <p className="text-sm">
            Performance insights based on data from the last 1 month. The overall grade combines win rate, 
            task completion, SQL rate, appointment rate, attendance rate, and sale rate. 
            To improve performance: focus on lead qualification, complete tasks on time, schedule and attend meetings, 
            and maintain high conversion rates throughout the sales funnel.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PerformanceInsightsCard;
