import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GeneralDashboard from '@/components/GeneralDashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { api, updateProfile } = useAuthStore();
  const [account, setAccount] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Check for payment success parameters and validate existing account
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const payment = urlParams.get('payment');
    const plan = urlParams.get('plan');
    const upgraded = urlParams.get('upgraded');
    const welcome = urlParams.get('welcome');

    // If payment success parameters are present, show dashboard immediately
    if (payment === 'success' && plan && upgraded === 'true') {
      console.log('🎉 Payment success detected in Index component');
      setShowDashboard(true);
      return;
    }

    // If user has a kommo account in profile, validate it automatically
    if (user?.kommo_account && !showDashboard) {
      validateExistingAccount(user.kommo_account);
    }
  }, [location.search, user?.kommo_account, showDashboard]);

  // Function to validate existing account
  const validateExistingAccount = async (accountDomain: string) => {
    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      console.log('🔍 Validating existing Kommo account:', accountDomain);
      
      const response = await api.post('/auth/validate-kommo-account', {
        account_domain: accountDomain
      });

      if (response.data.success) {
        console.log('✅ Existing Kommo account validated successfully:', accountDomain);
        
        // Update user's profile with the validated account if it's different
        if (accountDomain !== user?.kommo_account) {
          try {
            console.log('🔄 Updating user profile with validated account:', accountDomain);
            await updateProfile({
              kommo_account: accountDomain
            });
            console.log('✅ User profile updated successfully');
          } catch (updateError: any) {
            console.error('⚠️ Failed to update user profile:', updateError);
            // Don't block the dashboard access if profile update fails
          }
        }
        
        setValidationSuccess(true);
        setShowDashboard(true);
        setAccount(accountDomain);
      }
    } catch (error: any) {
      console.error('❌ Existing Kommo account validation failed:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to validate existing Kommo account';
      setValidationError(errorMessage);
      
      // Don't show dashboard if validation fails
      setShowDashboard(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) return;

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      console.log('🔍 Validating Kommo account:', account);
      
      const response = await api.post('/auth/validate-kommo-account', {
        account_domain: account.trim()
      });

      if (response.data.success) {
        console.log('✅ Kommo account validated successfully:', account.trim());
        
        // Update user's profile with the new Kommo account
        try {
          console.log('🔄 Updating user profile with new Kommo account:', account.trim());
          await updateProfile({
            kommo_account: account.trim()
          });
          console.log('✅ User profile updated successfully');
        } catch (updateError: any) {
          console.error('⚠️ Failed to update user profile:', updateError);
          // Don't block the dashboard access if profile update fails
        }
        
        setValidationSuccess(true);
        setShowDashboard(true);
      }
    } catch (error: any) {
      console.error('❌ Kommo account validation failed:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to validate Kommo account';
      setValidationError(errorMessage);
      
      // Don't show dashboard if validation fails
      setShowDashboard(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Only show dashboard if explicitly set to show (after successful validation) or payment success
  if (showDashboard) {
    // Use the validated account, which should now be updated in the user profile
    const accountToUse = account || user?.kommo_account || '';
    console.log('🚀 Loading Dashboard with account:', accountToUse);
    return <GeneralDashboard account={accountToUse} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md bg-gradient-card shadow-elegant border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CRM Analytics
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter your Kommo account to view analytics
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="account" className="text-sm font-medium text-card-foreground">
                Account Domain
              </label>
              <Input
                id="account"
                type="text"
                placeholder="e.g., yourcompany.kommo.com"
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value);
                  setValidationError(null);
                  setValidationSuccess(false);
                }}
                className="mt-1"
                required
                disabled={isValidating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your Kommo account domain or subdomain
              </p>
            </div>

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{validationError}</p>
                    <div className="text-sm">
                      <p>To use Dashboard++, you need to:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Install the Dashboard++ app from the Kommo marketplace</li>
                        <li>Complete the OAuth authorization process</li>
                        <li>Then return here to access your analytics</li>
                      </ol>
                    </div>
                    <div className="mt-3">
                      <a 
                        href="https://marketplace.kommo.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit Kommo Marketplace
                      </a>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Success */}
            {validationSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Kommo account validated successfully! Loading your dashboard...
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              disabled={isValidating}
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validating Account...
                </div>
              ) : (
                'View Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
