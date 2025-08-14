import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import DoughnutChart from './charts/DoughnutChart';

interface LeadSourceAnalysisProps {
  incomingLeads: any;
}

export const LeadSourceAnalysis: React.FC<LeadSourceAnalysisProps> = ({ incomingLeads }) => {
  const sources = incomingLeads.bySource || {};
  const totalLeads = incomingLeads.total || 0;

  if (totalLeads === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Lead Source Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No lead source data available.</p>
        </CardContent>
      </Card>
    );
  }

  const sourceLabels = Object.keys(sources);
  const sourceData = Object.values(sources).map(value => Number(value));

  const chartData = {
    labels: sourceLabels,
    datasets: [{
      data: sourceData,
      backgroundColor: [
        'hsl(142 70% 45%)',
        'hsl(271 89% 58%)',
        'hsl(45 93% 58%)',
        'hsl(0 84% 60%)',
        'hsl(217 91% 60%)',
        'hsl(142 80% 55%)'
      ]
    }]
  };

  const sortedSources = Object.entries(sources)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Lead Source Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-4">Source Distribution</h4>
            <div className="space-y-3">
              {sortedSources.map(([source, count], index) => {
                const countNum = Number(count);
                const percentage = (countNum / totalLeads * 100).toFixed(1);
                const isTopPerformer = index === 0;
                
                return (
                  <div key={source} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {isTopPerformer && <TrendingUp className="h-4 w-4 text-success" />}
                      <div>
                        <p className="font-medium">{source}</p>
                        <p className="text-sm text-muted-foreground">{countNum} leads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={isTopPerformer ? 'default' : 'secondary'}>
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <DoughnutChart data={chartData} size={200} />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{totalLeads}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{sourceLabels.length}</p>
              <p className="text-sm text-muted-foreground">Active Sources</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
