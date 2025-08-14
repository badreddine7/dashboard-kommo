import { useState, useEffect } from 'react';
import { api, useAuthStore } from '@/stores/authStore';

interface RepData {
  user_id: string;
  name: string;
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  win_rate: number;
  avg_cycle_days: number | null;
  completed_tasks: number;
  follow_up_ratio: number;
  completion_rate: number;
  avg_deal_size: number | null;
  leads_by_stage: Record<string, number>;
  conversion: Record<string, number>;
  notes_stats: {
    total: number;
    ratio: number;
  };
  tasks: {
    created: number;
    completed: number;
    overdue: number;
  };
  messages: {
    messages: number;
    emails: number;
    sms: number;
  };
  events_count: number;
  heatmap: Record<string, number>;
  rep_fields_stats: {
    incomplete_leads_count: number;
    incomplete_fields: number;
  };
  stage_time_stats: {
    average_days_per_stage: Record<string, number>;
    median_days_per_stage: Record<string, number>;
  };
  full_pipeline_stats: {
    average_days: number;
    median_days: number;
  };
  sales_funnel: {
    sql_leads: number;
    unreachable_leads: number;
    not_sql_leads: number;
    sql_rate: number;
    appointments: number;
    appointment_rate: number;
    attended: number;
    attendance_rate: number;
    sale_rate: number;
    overall_funnel_rate: number;
  };
  incoming_leads: {
    total: number;
    bySource: Record<string, number>;
    byFunnel: Record<string, number>;
  };
}

interface AnalyticsData {
  generated_at: string;
  reps: RepData[];
}

export const useAnalytics = (account: string) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  const fetchData = async () => {
    if (!account) return;
    
    // Debug authentication state
    console.log('🔍 Analytics Debug:', {
      isAuthenticated,
      user: user ? { id: user.id, email: user.email } : null,
      account
    });
    
    if (!isAuthenticated) {
      setError('Please log in to view analytics data');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Making API request to:', `/report?account=${account}`);
      
      // Use authenticated API instance
      const response = await api.get(`/report?account=${account}`);
      console.log('✅ Analytics response:', response.data);
      setData(response.data);
    } catch (err: any) {
      console.error('❌ Analytics fetch error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
      
      // Handle specific Kommo token errors
      if (errorMessage.includes('refresh_failed') || errorMessage.includes('Token has been revoked')) {
        setError('Kommo connection expired. Please re-authenticate with your Kommo account to view analytics data.');
      } else if (err.response?.status === 403) {
        // Check for specific subscription error messages
        if (errorMessage.includes('expired')) {
          setError('Your subscription has expired. Please upgrade to continue accessing premium features.');
        } else if (errorMessage.includes('cancelled')) {
          setError('Your subscription has been cancelled but is still active until the end of your billing period.');
        } else if (errorMessage.includes('Feature not available')) {
          setError('This feature requires a premium subscription. Please upgrade to unlock full access.');
        } else {
          setError('Access denied. Please check your subscription and try again.');
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [account, isAuthenticated]);

  return { data, loading, error, refetch: fetchData };
};