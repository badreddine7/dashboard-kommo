import React from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface CallsCardProps {
  calls: {
    incoming: number;
    outgoing: number;
    total: number;
  };
}

const CallsCard: React.FC<CallsCardProps> = ({ calls }) => {
  const { incoming, outgoing, total } = calls;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-gradient-card shadow-elegant border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-blue-500" />
                Call Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Incoming and outgoing calls
              </CardDescription>
            </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Calls */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <p className="text-xs text-muted-foreground">Total Calls</p>
        </div>

        {/* Incoming vs Outgoing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PhoneIncoming className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-600">Incoming</span>
            </div>
            <div className="text-lg font-bold text-green-600">{incoming}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${((incoming / total) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
          
          <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PhoneOutgoing className="h-3 w-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Outgoing</span>
            </div>
            <div className="text-lg font-bold text-orange-600">{outgoing}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${((outgoing / total) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Call Ratio Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            {incoming > outgoing ? 'More Incoming' : incoming < outgoing ? 'More Outgoing' : 'Balanced'}
          </Badge>
        </div>
      </CardContent>
        </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <p className="text-sm">
            Call activity for the last 1 month. Tracks incoming and outgoing call events from Kommo. 
            To improve this metric: log all calls in Kommo, use call tracking features, record call outcomes, 
            and ensure proper call documentation for better analytics.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CallsCard;
