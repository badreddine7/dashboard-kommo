import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Activity, 
  BarChart3, 
  Users, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAnalytics } from '../hooks/useAnalytics';

interface UsageData {
  api_calls: {
    used: number;
    limit: number;
    percentage: number;
  };
  team_members: {
    used: number;
    limit: number;
    percentage: number;
  };
  custom_reports: {
    used: number;
    limit: number;
    percentage: number;
  };
}

const UsageTracker: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { api, user, subscription } = useAuthStore();
  
  // Get team member count from analytics data if available
  const { data: analyticsData } = useAnalytics(user?.kommo_account || '');

  useEffect(() => {
    fetchUsageData();
  }, [analyticsData?.reps?.length]); // Refetch when team member count changes

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Get actual team member count from analytics data
      const teamMemberCount = analyticsData?.reps?.length || 1;
      
      const response = await api.get(`/usage?teamMemberCount=${teamMemberCount}`);
      setUsageData(response.data.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      // Set default usage data if API fails
      setUsageData(getDefaultUsageData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultUsageData = (): UsageData => {
    const planType = subscription?.plan_type || 'ENTERPRISE';
    const limits = getPlanLimits(planType);
    
    // Use actual team member count from analytics data
    const actualTeamMembers = analyticsData?.reps?.length || 1;
    
    return {
      api_calls: {
        used: 0,
        limit: limits.api_calls_per_day,
        percentage: 0
      },
      team_members: {
        used: actualTeamMembers,
        limit: limits.team_members,
        percentage: limits.team_members > 0 ? (actualTeamMembers / limits.team_members) * 100 : 0
      },
      custom_reports: {
        used: 0,
        limit: limits.custom_reports,
        percentage: 0
      }
    };
  };

  const getPlanLimits = (planType: string) => {
    switch (planType) {
      case 'ENTERPRISE':
        return {
          api_calls_per_day: 10000,
          team_members: -1, // unlimited
          custom_reports: -1 // unlimited
        };
      default: // ENTERPRISE
        return {
          api_calls_per_day: 10000,
          team_members: -1, // unlimited
          custom_reports: -1 // unlimited
        };
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number | undefined) => {
    if (limit === undefined || limit === null) {
      // Fallback to plan limits if API doesn't return limits
          const planType = subscription?.plan_type || 'ENTERPRISE';
    const limits = getPlanLimits(planType);
      // Return a reasonable default based on plan type
      return planType === 'ENTERPRISE' ? 'Unlimited' : 'Unknown';
    }
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentage >= 75) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Your current usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Your current usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to load usage data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Usage & Limits
        </CardTitle>
        <CardDescription>
          Your current usage statistics for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Horizontal Layout for Usage Items */}
        <div className="grid grid-cols-3 gap-3">
          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">API Calls</span>
              </div>
              {getUsageIcon(usageData.api_calls.percentage || 0)}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {(usageData.api_calls.used || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                of {formatLimit(usageData.api_calls.limit)} today
              </div>
            </div>
            <Progress 
              value={usageData.api_calls.percentage || 0} 
              className="h-2"
            />
            <p className={`text-xs text-center ${getUsageColor(usageData.api_calls.percentage || 0)}`}>
              {(usageData.api_calls.percentage || 0).toFixed(1)}% used
            </p>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Team Members</span>
              </div>
              {getUsageIcon(usageData.team_members.percentage || 0)}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {usageData.team_members.used || 0}
              </div>
              <div className="text-xs text-gray-500">
                of {formatLimit(usageData.team_members.limit)} total
              </div>
            </div>
            <Progress 
              value={usageData.team_members.percentage || 0} 
              className="h-2"
            />
            <p className={`text-xs text-center ${getUsageColor(usageData.team_members.percentage || 0)}`}>
              {(usageData.team_members.percentage || 0).toFixed(1)}% used
            </p>
          </div>

          {/* Custom Reports */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Custom Reports</span>
              </div>
              {getUsageIcon(usageData.custom_reports.percentage || 0)}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {usageData.custom_reports.used || 0}
              </div>
              <div className="text-xs text-gray-500">
                of {formatLimit(usageData.custom_reports.limit)} total
              </div>
            </div>
            <Progress 
              value={usageData.custom_reports.percentage || 0} 
              className="h-2"
            />
            <p className={`text-xs text-center ${getUsageColor(usageData.custom_reports.percentage || 0)}`}>
              {(usageData.custom_reports.percentage || 0).toFixed(1)}% used
            </p>
          </div>
        </div>

        {/* Plan Information */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Plan:</span>
            <Badge variant="outline">
              {subscription?.plan_type || 'ENTERPRISE'}
            </Badge>
          </div>
          {subscription?.status === 'TRIAL' && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Trial Status:</span>
              <Badge variant="outline" className="text-blue-600">
                Trial Active
              </Badge>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {((usageData.api_calls.percentage || 0) >= 75 || 
          (usageData.team_members.percentage || 0) >= 75 || 
          (usageData.custom_reports.percentage || 0) >= 75) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              You're approaching your plan limits
            </p>
            <button 
              onClick={() => window.location.href = '/pricing'}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Upgrade your plan to get more resources
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageTracker;
