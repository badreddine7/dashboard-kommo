import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(3);

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const payment = urlParams.get('payment');
  const plan = urlParams.get('plan');

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/dashboard');
    }
  }, [countdown, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (payment !== 'success' || !plan) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card shadow-elegant border-border/50">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-glow">
            <CheckCircle className="h-8 w-8 text-primary-foreground" />
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Welcome to Dashboard++ Enterprise
            </p>
          </div>

          {/* Sparkle Animation */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">Your subscription is now active</span>
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-primary hover:shadow-glow text-primary-foreground shadow-lg transition-all duration-300 mb-4"
            size="lg"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {/* Auto-redirect */}
          <p className="text-xs text-muted-foreground">
            Redirecting automatically in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
