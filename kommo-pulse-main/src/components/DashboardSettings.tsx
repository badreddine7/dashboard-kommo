import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Grid, List, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDashboard } from '@/contexts/DashboardContext';

export const DashboardSettings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useDashboard();
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  const handleRefreshIntervalChange = (value: number[]) => {
    updateSettings({ refreshInterval: value[0] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Layout Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Layout</h3>
            <div className="flex gap-2">
              <Button
                variant={settings.layout === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ layout: 'grid' })}
                className="flex-1"
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={settings.layout === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ layout: 'list' })}
                className="flex-1"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Visibility</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="metrics" className="flex items-center gap-2">
                  {settings.showMetrics ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Key Metrics
                </Label>
                <Switch
                  id="metrics"
                  checked={settings.showMetrics}
                  onCheckedChange={() => handleToggle('showMetrics')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="charts" className="flex items-center gap-2">
                  {settings.showCharts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Charts
                </Label>
                <Switch
                  id="charts"
                  checked={settings.showCharts}
                  onCheckedChange={() => handleToggle('showCharts')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="heatmap" className="flex items-center gap-2">
                  {settings.showHeatmap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Activity Heatmap
                </Label>
                <Switch
                  id="heatmap"
                  checked={settings.showHeatmap}
                  onCheckedChange={() => handleToggle('showHeatmap')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="funnel" className="flex items-center gap-2">
                  {settings.showFunnel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Sales Funnel
                </Label>
                <Switch
                  id="funnel"
                  checked={settings.showFunnel}
                  onCheckedChange={() => handleToggle('showFunnel')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="communication" className="flex items-center gap-2">
                  {settings.showCommunication ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Communication
                </Label>
                <Switch
                  id="communication"
                  checked={settings.showCommunication}
                  onCheckedChange={() => handleToggle('showCommunication')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="stageAnalysis" className="flex items-center gap-2">
                  {settings.showStageAnalysis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Stage Analysis
                </Label>
                <Switch
                  id="stageAnalysis"
                  checked={settings.showStageAnalysis}
                  onCheckedChange={() => handleToggle('showStageAnalysis')}
                />
              </div>
            </div>
          </div>

          {/* Auto Refresh Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Auto Refresh</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRefresh" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Enable Auto Refresh
                </Label>
                <Switch
                  id="autoRefresh"
                  checked={settings.autoRefresh}
                  onCheckedChange={() => handleToggle('autoRefresh')}
                />
              </div>
              {settings.autoRefresh && (
                <div className="space-y-2">
                  <Label>Refresh Interval: {settings.refreshInterval} seconds</Label>
                  <Slider
                    value={[settings.refreshInterval]}
                    onValueChange={handleRefreshIntervalChange}
                    max={1800}
                    min={60}
                    step={60}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
