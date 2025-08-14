import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Settings, 
  Bell, 
  TrendingUp, 
  Globe, 
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ThemeToggle } from './ui/theme-toggle';

const FeatureShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('theme');

  const features = [
    {
      id: 'theme',
      title: 'Dark/Light Mode',
      description: 'Seamlessly switch between dark and light themes with system preference support',
      icon: Palette,
      demo: (
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-sm text-muted-foreground">
            Click to toggle between themes
          </div>
        </div>
      )
    },
    {
      id: 'customization',
      title: 'Dashboard Customization',
      description: 'Customize your dashboard layout and component visibility',
      icon: Settings,
      demo: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Grid Layout</Badge>
            <Badge variant="outline">List Layout</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Toggle components on/off and change layout
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Real-time Notifications',
      description: 'Get instant alerts for important metrics and events',
      icon: Bell,
      demo: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-success" />
            <span>New lead added</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span>Task overdue</span>
          </div>
        </div>
      )
    },
    {
      id: 'insights',
      title: 'Performance Insights',
      description: 'AI-powered recommendations and performance analysis',
      icon: TrendingUp,
      demo: (
        <div className="space-y-2">
          <div className="text-sm p-2 bg-success/10 dark:bg-success/20 rounded border border-success/20">
            <strong>Excellent Win Rate!</strong> Your 65% win rate is outstanding.
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Comprehensive lead source analysis and funnel metrics',
      icon: Globe,
      demo: (
        <div className="space-y-2">
          <div className="text-sm">
            <div>Lead Sources: Website (45%), Social (30%), Referral (25%)</div>
            <div className="text-muted-foreground">Top performing source identified</div>
          </div>
        </div>
      )
    },
    {
      id: 'refresh',
      title: 'Auto Refresh',
      description: 'Configurable automatic data refresh with manual override',
      icon: RefreshCw,
      demo: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Auto-refresh every 5 minutes
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      Dashboard++ Features
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover the enhanced CRM analytics dashboard
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {features.map((feature) => (
          <Button
            key={feature.id}
            variant={activeFeature === feature.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFeature(feature.id)}
            className="flex items-center gap-2"
          >
            <feature.icon className="h-4 w-4" />
            {feature.title}
          </Button>
        ))}
      </div>

      {/* Active Feature Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={`transition-all duration-300 ${
              activeFeature === feature.id
                ? 'ring-2 ring-primary shadow-lg'
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <feature.icon className="h-5 w-5" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {feature.description}
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                {feature.demo}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-center">Ready to Get Started?</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Experience the enhanced Dashboard++ dashboard with all these features and more.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-gradient-primary">
              View Dashboard
            </Button>
            <Button variant="outline">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureShowcase;
