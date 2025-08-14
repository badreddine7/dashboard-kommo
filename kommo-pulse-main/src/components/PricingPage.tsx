import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  plan_type: string;
  trial_period_days?: number;
  features: string[];
}

const PricingPage: React.FC = () => {
  const { subscription, api } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stripe/plans');
      setPlans(response.data.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to default plans if API fails
      setPlans([
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For organizations of all sizes',
          price: 99.99,
          currency: 'usd',
          interval: 'month',
          plan_type: 'ENTERPRISE',
          trial_period_days: 14,
          features: [
            'Unlimited team members',
            'Advanced analytics & reporting',
            'Custom integrations & API access',
            'White-label options',
            'Priority support',
            '14-day free trial'
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planType: string) => {
    return subscription?.plan_type === planType;
  };

  const canPurchasePlan = (planType: string) => {
    // If it's not the current plan, they can purchase it
    if (!isCurrentPlan(planType)) return true;
    
    // If it is the current plan, they can only purchase if they're on trial
    return subscription?.status === 'TRIAL';
  };

  const handleUpgrade = async (planType: string) => {
    if (!canPurchasePlan(planType)) return;
    
    setUpgrading(planType);
    try {
      console.log('Creating checkout session for plan:', planType);
      const response = await api.post('/stripe/create-checkout-session', {
        planType: planType
      });
      
      console.log('Checkout response:', response.data);
      
      if (response.data.success && response.data.data.url) {
        window.location.href = response.data.data.url;
      } else {
        console.error('No checkout URL received');
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'ENTERPRISE':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Crown className="h-6 w-6 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-gray-600 mb-8">Loading available plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Start with a 14-day free trial
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${isCurrentPlan(plan.plan_type) ? 'ring-2 ring-blue-500' : ''}`}
          >
            {isCurrentPlan(plan.plan_type) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={subscription?.status === 'TRIAL' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}>
                  {subscription?.status === 'TRIAL' ? 'Trial' : 'Current Plan'}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getPlanIcon(plan.plan_type)}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              {isCurrentPlan(plan.plan_type) && subscription?.status !== 'TRIAL' ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(plan.plan_type)}
                  disabled={upgrading === plan.plan_type}
                >
                  {upgrading === plan.plan_type ? 'Processing...' : 
                   isCurrentPlan(plan.plan_type) && subscription?.status === 'TRIAL' ? 'Purchase Plan' : 
                   plan.price === 0 ? 'Get Started' : 'Upgrade'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
