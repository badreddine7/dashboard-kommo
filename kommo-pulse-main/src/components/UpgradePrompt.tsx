import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, Zap, Shield, BarChart3, Users, Target, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ui/theme-toggle';
import { UserMenu } from './UserMenu';

interface UpgradePromptProps {
  error?: string;
  currentPlan?: string;
  onRetry?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  error, 
  currentPlan = 'FREE',
  onRetry 
}) => {
  const navigate = useNavigate();

  const isSubscriptionExpired = error?.includes('expired');
  const isSubscriptionCancelled = error?.includes('cancelled');
  const isAccessDenied = error?.includes('Access denied') || error?.includes('subscription');

  if (!isSubscriptionExpired && !isSubscriptionCancelled && !isAccessDenied) {
    return null;
  }



  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Advanced Analytics',
      description: 'Detailed insights and performance metrics'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Management',
      description: 'Manage multiple sales representatives'
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Lead Scoring',
      description: 'Intelligent lead prioritization'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Real-time Updates',
      description: 'Live data synchronization'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Priority Support',
      description: '24/7 customer support'
    }
  ];

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
                   {isSubscriptionExpired ? 'Subscription Expired' : 
                    isSubscriptionCancelled ? 'Subscription Cancelled' : 'Upgrade Required'}
                 </h1>
                 <p className="text-muted-foreground mt-1">
                   {isSubscriptionExpired 
                     ? 'Your subscription has expired. Renew to continue accessing premium features.'
                     : isSubscriptionCancelled
                     ? 'Your subscription has been cancelled but is still active until the end of your billing period.'
                     : 'This feature requires a premium subscription. Upgrade to unlock full access.'
                   }
                 </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Status Card */}
          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
                             <CardTitle className="text-2xl font-bold">
                 {isSubscriptionExpired ? 'Subscription Expired' : 
                  isSubscriptionCancelled ? 'Subscription Cancelled' : 'Upgrade Required'}
               </CardTitle>
               <CardDescription className="text-base">
                 {isSubscriptionExpired 
                   ? 'Your subscription has expired. Renew to continue accessing premium features.'
                   : isSubscriptionCancelled
                   ? 'Your subscription has been cancelled but is still active until the end of your billing period. You can reactivate anytime.'
                   : 'This feature requires a premium subscription. Upgrade to unlock full access.'
                 }
               </CardDescription>
              {currentPlan && currentPlan !== 'FREE' && (
                <Badge variant="secondary" className="mt-3">
                  Current Plan: {currentPlan}
                </Badge>
              )}
            </CardHeader>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card shadow-elegant border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <div className="text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                 <Button 
                   size="lg" 
                   className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                   onClick={() => navigate('/pricing')}
                 >
                   {isSubscriptionCancelled ? 'Reactivate Subscription' : 'View Plans & Upgrade'}
                 </Button>
                
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={onRetry}
                  >
                    Try Again
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={() => navigate('/billing')}
                >
                  Manage Billing
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                <p>
                  Need help? Contact our support team or check your billing status.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
