import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  CreditCard, 
  Crown,
  Calendar,
  Mail,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, subscription, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadge = () => {
    if (!subscription) return null;

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ENTERPRISE: "secondary"
    };

    const colors: Record<string, string> = {
      ENTERPRISE: "text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950"
    };

    return (
      <Badge variant={variants[subscription.plan_type] || "outline"} className={colors[subscription.plan_type]}>
        {subscription.plan_type === 'ENTERPRISE' && (
          <Crown className="w-3 h-3 mr-1" />
        )}
        {subscription.status === 'TRIAL' ? 'Enterprise Trial' : subscription.plan_type}
      </Badge>
    );
  };

  const getTrialInfo = () => {
    if (subscription?.status === 'TRIAL' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        return `${daysLeft} days left`;
      } else {
        return 'Trial expired';
      }
    }
    return null;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {user.name || 'User'}
              </p>
              {getPlanBadge()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Mail className="mr-1 h-3 w-3" />
              {user.email}
            </div>
            {subscription?.status === 'TRIAL' && (
              <div className="text-xs text-muted-foreground">
                {getTrialInfo()}
              </div>
            )}
            {user.kommo_account && (
              <div className="text-xs text-muted-foreground">
                Kommo: {user.kommo_account}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = '/pricing'}>
          <Zap className="mr-2 h-4 w-4" />
          <span>Upgrade Plan</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = '/billing'}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
