import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Mail,
  Building
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const CustomerPortal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { user, subscription, api, refreshSubscription } = useAuthStore();

  const handleManageBilling = async () => {
    // Check if we have a subscription with Stripe subscription ID
    if (!subscription?.stripe_subscription_id) {
      setError('No billing information found. Please upgrade to a paid plan first.');
      return;
    }

    // Check if we have a customer ID
    if (!user?.stripe_customer_id) {
      setError('Customer ID not found. Please try refreshing your subscription data.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating portal session for customer:', user.stripe_customer_id);
      
      const response = await api.post('/stripe/create-portal-session', {
        customerId: user.stripe_customer_id
      });
      
      console.log('Portal session response:', response.data);
      
      if (response.data.success && response.data.data.url) {
        window.location.href = response.data.data.url;
      } else {
        setError('Failed to open billing portal');
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      
      // Handle specific portal configuration error
      if (error.response?.data?.error === 'PORTAL_NOT_CONFIGURED') {
        setError('Billing portal is not configured yet. Please try again later or contact support.');
      } else {
        setError(error.response?.data?.message || 'Failed to open billing portal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      setError('No subscription found to cancel.');
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      console.log('Cancelling subscription:', subscription.stripe_subscription_id);
      
      const response = await api.post('/stripe/cancel-subscription', {
        subscriptionId: subscription.stripe_subscription_id
      });

      console.log('Cancel response:', response.data);

      if (response.data.success) {
        await refreshSubscription();
        alert('Subscription cancelled successfully. You will have access until the end of your current billing period.');
      } else {
        setError(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      setError(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  // Get effective status considering cancel_at_period_end
  const getEffectiveStatus = () => {
    if (subscription?.cancel_at_period_end) {
      return 'CANCELLED';
    }
    return subscription?.status || 'ENTERPRISE';
  };

  const getStatusIcon = (status: string) => {
    // Check if subscription is cancelled but still active
    if (subscription?.cancel_at_period_end) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'TRIAL':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    // Check if subscription is cancelled but still active
    if (subscription?.cancel_at_period_end) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTrialDaysLeft = () => {
    if (subscription?.status === 'TRIAL' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? daysLeft : 0;
    }
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your billing portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600">
            Manage your subscription, billing information, and payment methods
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your active subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan:</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {subscription?.plan_type || 'ENTERPRISE'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(getEffectiveStatus())}
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(getEffectiveStatus())}
                  >
                    {getEffectiveStatus()}
                  </Badge>
                </div>
              </div>

              {subscription?.trial_ends_at && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trial ends:</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(subscription.trial_ends_at)}
                  </span>
                </div>
              )}

              {subscription?.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next billing:</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}

              {getTrialDaysLeft() !== null && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {getTrialDaysLeft()} days left in your trial
                  </p>
                </div>
              )}

              {subscription?.plan_type === 'ENTERPRISE' && !subscription?.cancel_at_period_end && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    You'll have access until the end of your current billing period
                  </p>
                </div>
              )}

              {subscription?.cancel_at_period_end && (
                <div className="pt-4 border-t">
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription has been cancelled. You'll have access until{' '}
                      {subscription.current_period_end ? 
                        new Date(subscription.current_period_end).toLocaleDateString() : 
                        'the end of your billing period'
                      }.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Name:</span>
                <span className="text-sm text-gray-600">{user.name || 'Not set'}</span>
              </div>

              {user.kommo_account && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Kommo Account:</span>
                  <span className="text-sm text-gray-600">{user.kommo_account}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Member since:</span>
                <span className="text-sm text-gray-600">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Billing Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Management
            </CardTitle>
            <CardDescription>
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleManageBilling}
                  disabled={loading || !subscription?.stripe_subscription_id}
                  className="w-full md:w-auto"
                  variant={subscription?.stripe_subscription_id ? "default" : "outline"}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opening Portal...
                    </div>
                  ) : subscription?.stripe_subscription_id ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Billing
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Access Billing
                    </>
                  )}
                </Button>

                {subscription?.status === 'TRIAL' && (
                  <Button 
                    onClick={() => window.location.href = '/pricing'}
                    className="w-full md:w-auto"
                    variant="default"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Purchase Enterprise Plan
                  </Button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>• Update payment methods</p>
                <p>• View billing history</p>
                <p>• Download invoices</p>
                <p>• Change subscription plan</p>
                <p>• Cancel subscription</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
            <CardDescription>
              What's included in your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Analytics & Reports</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time dashboard</li>
                  <li>• Custom reports</li>
                  <li>• Performance insights</li>
                  <li>• Export capabilities</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Team & Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Team member management</li>
                  <li>• Role-based access</li>
                  <li>• API access</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerPortal;
