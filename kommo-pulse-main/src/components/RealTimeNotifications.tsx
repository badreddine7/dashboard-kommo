import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface RealTimeNotificationsProps {
  userData: any;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ userData }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      
      // Check for new leads
      if (userData.total_leads > 0) {
        newNotifications.push({
          id: 'new-leads',
          type: 'success',
          title: 'New Leads Added',
          message: `${userData.total_leads} leads in your pipeline`,
          timestamp: new Date(),
          read: false
        });
      }

      // Check for overdue tasks
      if (userData.tasks.overdue > 0) {
        newNotifications.push({
          id: 'overdue-tasks',
          type: 'warning',
          title: 'Overdue Tasks',
          message: `${userData.tasks.overdue} tasks are overdue`,
          timestamp: new Date(),
          read: false
        });
      }

      // Check for low completion rate
      if (userData.completion_rate < 0.7) {
        newNotifications.push({
          id: 'low-completion',
          type: 'warning',
          title: 'Task Completion Alert',
          message: `Your task completion rate is ${(userData.completion_rate * 100).toFixed(1)}%`,
          timestamp: new Date(),
          read: false
        });
      }

      // Check for high activity
      if (userData.events_count > 50) {
        newNotifications.push({
          id: 'high-activity',
          type: 'info',
          title: 'High Activity Level',
          message: `${userData.events_count} activities recorded today`,
          timestamp: new Date(),
          read: false
        });
      }

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [userData]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-accent" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3);

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No notifications at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {notifications.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-colors ${
                notification.read 
                  ? 'bg-muted/50 border-muted' 
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
