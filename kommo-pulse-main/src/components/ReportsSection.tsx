import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuthStore } from '../stores/authStore';
import jsPDF from 'jspdf';

interface ReportsSectionProps {
  repData: any;
}

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'performance' | 'activity' | 'financial' | 'team';
  formats: ('pdf' | 'csv' | 'excel')[];
  timeRanges: string[];
}

const reportTypes: ReportConfig[] = [
  {
    id: 'performance-summary',
    name: 'Performance Summary',
    description: 'Comprehensive overview of sales performance metrics',
    icon: BarChart3,
    type: 'performance',
    formats: ['pdf', 'csv', 'excel'],
    timeRanges: ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month', 'This quarter', 'This year']
  },
  {
    id: 'activity-report',
    name: 'Activity Report',
    description: 'Detailed breakdown of calls, emails, and tasks',
    icon: Activity,
    type: 'activity',
    formats: ['pdf', 'csv'],
    timeRanges: ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month']
  },
  {
    id: 'revenue-analysis',
    name: 'Revenue Analysis',
    description: 'Financial performance and revenue trends',
    icon: DollarSign,
    type: 'financial',
    formats: ['pdf', 'excel'],
    timeRanges: ['Last 30 days', 'Last 90 days', 'This month', 'This quarter', 'This year']
  },
  {
    id: 'team-comparison',
    name: 'Team Comparison',
    description: 'Compare performance across team members',
    icon: Users,
    type: 'team',
    formats: ['pdf', 'csv'],
    timeRanges: ['Last 30 days', 'This month', 'This quarter']
  },
  {
    id: 'conversion-funnel',
    name: 'Conversion Funnel',
    description: 'Lead conversion rates and pipeline analysis',
    icon: Target,
    type: 'performance',
    formats: ['pdf', 'excel'],
    timeRanges: ['Last 30 days', 'Last 90 days', 'This month', 'This quarter']
  },
  {
    id: 'time-analysis',
    name: 'Time Analysis',
    description: 'Time spent on activities and efficiency metrics',
    icon: Clock,
    type: 'activity',
    formats: ['pdf', 'csv'],
    timeRanges: ['Last 7 days', 'Last 30 days', 'This month']
  }
];

const ReportsSection: React.FC<ReportsSectionProps> = ({ repData }) => {
  const { tokens, isAuthenticated } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string;
    name: string;
    format: string;
    timestamp: Date;
    status: 'completed' | 'failed';
  }>>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!selectedReport || !timeRange || !format) {
      alert('Please select all required fields');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🔍 Report generation - Auth check:', {
        isAuthenticated,
        hasTokens: !!tokens,
        hasAccessToken: !!tokens?.accessToken,
        tokenLength: tokens?.accessToken?.length
      });
      
      if (!isAuthenticated || !tokens?.accessToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`
        },
        body: JSON.stringify({
          reportType: selectedReport,
          timeRange,
          format,
          userId: repData.user_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      
      if (result.success) {
        const report = reportTypes.find(r => r.id === selectedReport);
        const newReport = {
          id: result.data.reportId,
          name: report?.name || 'Unknown Report',
          format: format.toUpperCase(),
          timestamp: new Date(result.data.generatedAt),
          status: 'completed' as const,
          data: result.data.data
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
        
        // Create and download the report file
        await downloadReport(newReport);
      } else {
        throw new Error(result.message || 'Report generation failed');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (report: any) => {
    try {
      let content: string | Blob = '';
      let filename = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      let mimeType = 'application/json';
      
      switch (report.format) {
        case 'CSV':
          content = generateCSV(report);
          filename += '.csv';
          mimeType = 'text/csv';
          break;
        case 'PDF':
          content = generatePDF(report);
          filename += '.pdf';
          mimeType = 'application/pdf';
          break;
        case 'EXCEL':
          content = generateExcel(report);
          filename += '.xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          content = JSON.stringify(report.data, null, 2);
          filename += '.json';
          mimeType = 'application/json';
      }

      // Create and download file
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`Report "${report.name}" generated and downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    }
  };

  const generateCSV = (report: any) => {
    const data = report.data;
    let csv = '';
    
    switch (report.name) {
      case 'Performance Summary':
        csv = `Metric,Value\n`;
        csv += `Total Leads,${data.totalLeads}\n`;
        csv += `Won Leads,${data.wonLeads}\n`;
        csv += `Win Rate,${(data.winRate * 100).toFixed(2)}%\n`;
        csv += `Average Cycle Time,${data.avgCycleTime} days\n`;
        csv += `Total Revenue,$${data.totalRevenue.toLocaleString()}\n`;
        csv += `Activities Completed,${data.activitiesCompleted}\n`;
        break;
      case 'Activity Report':
        csv = `Activity Type,Count\n`;
        csv += `Total Calls,${data.totalCalls}\n`;
        csv += `Incoming Calls,${data.incomingCalls}\n`;
        csv += `Outgoing Calls,${data.outgoingCalls}\n`;
        csv += `Emails Sent,${data.emailsSent}\n`;
        csv += `Tasks Completed,${data.tasksCompleted}\n`;
        csv += `Meetings Scheduled,${data.meetingsScheduled}\n`;
        break;
      case 'Revenue Analysis':
        csv = `Metric,Value\n`;
        csv += `Total Revenue,$${data.totalRevenue.toLocaleString()}\n`;
        csv += `Average Deal Size,$${data.averageDealSize.toLocaleString()}\n`;
        csv += `Revenue Growth,${(data.revenueGrowth * 100).toFixed(2)}%\n`;
        csv += `\nTop Performing Products\n`;
        data.topPerformingProducts.forEach((product: any) => {
          csv += `${product.name},$${product.revenue.toLocaleString()}\n`;
        });
        break;
      case 'Team Comparison':
        csv = `Name,Performance,Leads,Revenue\n`;
        data.teamMembers.forEach((member: any) => {
          csv += `${member.name},${member.performance}%,${member.leads},$${member.revenue.toLocaleString()}\n`;
        });
        csv += `\nAverage Performance,${data.averagePerformance}%\n`;
        csv += `Top Performer,${data.topPerformer}\n`;
        csv += `Most Improved,${data.mostImproved}\n`;
        break;
      case 'Conversion Funnel':
        csv = `Stage,Count,Conversion Rate\n`;
        data.stages.forEach((stage: any) => {
          csv += `${stage.name},${stage.count},${stage.conversionRate}%\n`;
        });
        csv += `\nOverall Conversion Rate,${data.overallConversionRate}%\n`;
        csv += `Average Time in Pipeline,${data.averageTimeInPipeline} days\n`;
        break;
      case 'Time Analysis':
        csv = `Metric,Value\n`;
        csv += `Total Hours Worked,${data.totalHoursWorked}\n`;
        csv += `Efficiency Score,${(data.efficiencyScore * 100).toFixed(2)}%\n`;
        csv += `\nTime by Activity\n`;
        Object.entries(data.timeByActivity).forEach(([activity, hours]) => {
          csv += `${activity},${hours} hours\n`;
        });
        csv += `\nPeak Productivity Hours\n`;
        data.peakProductivityHours.forEach((hour: string) => {
          csv += `${hour}\n`;
        });
        break;
      default:
        csv = JSON.stringify(data, null, 2);
    }
    
    return csv;
  };

  const generatePDF = (report: any) => {
    const doc = new jsPDF();
    const data = report.data;
    
    // Set title
    doc.setFontSize(20);
    doc.text(report.name, 20, 20);
    
    // Set subtitle
    doc.setFontSize(12);
    doc.text(`Generated: ${report.timestamp.toLocaleDateString()} ${report.timestamp.toLocaleTimeString()}`, 20, 30);
    
    let yPosition = 50;
    
    switch (report.name) {
      case 'Performance Summary':
        doc.setFontSize(14);
        doc.text('Performance Metrics', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text(`Total Leads: ${data.totalLeads}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Won Leads: ${data.wonLeads}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Win Rate: ${(data.winRate * 100).toFixed(2)}%`, 20, yPosition);
        yPosition += 7;
        doc.text(`Average Cycle Time: ${data.avgCycleTime} days`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Revenue: $${data.totalRevenue.toLocaleString()}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Activities Completed: ${data.activitiesCompleted}`, 20, yPosition);
        break;
        
      case 'Activity Report':
        doc.setFontSize(14);
        doc.text('Activity Breakdown', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text(`Total Calls: ${data.totalCalls}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Incoming Calls: ${data.incomingCalls}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Outgoing Calls: ${data.outgoingCalls}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Emails Sent: ${data.emailsSent}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Tasks Completed: ${data.tasksCompleted}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Meetings Scheduled: ${data.meetingsScheduled}`, 20, yPosition);
        break;
        
      case 'Team Comparison':
        doc.setFontSize(14);
        doc.text('Team Performance', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        data.teamMembers.forEach((member: any) => {
          doc.text(`${member.name}: ${member.performance}% (${member.leads} leads, $${member.revenue.toLocaleString()})`, 20, yPosition);
          yPosition += 7;
        });
        
        yPosition += 5;
        doc.text(`Average Performance: ${data.averagePerformance}%`, 20, yPosition);
        yPosition += 7;
        doc.text(`Top Performer: ${data.topPerformer}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Most Improved: ${data.mostImproved}`, 20, yPosition);
        break;
        
      default:
        doc.setFontSize(10);
        doc.text('Report Data:', 20, yPosition);
        yPosition += 10;
        
        const jsonText = JSON.stringify(data, null, 2);
        const lines = jsonText.split('\n');
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 5;
        });
    }
    
    return doc.output('blob');
  };

  const generateExcel = (report: any) => {
    // For now, return a simple text representation
    // In a real implementation, you'd use an Excel library like xlsx
    return `Excel Report: ${report.name}\nGenerated: ${report.timestamp}\n\n${JSON.stringify(report.data, null, 2)}`;
  };

  const handleDownload = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId);
    if (report) {
      // Simulate download
      alert(`Downloading ${report.name} (${report.format})...`);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setGeneratedReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'activity': return <Activity className="h-4 w-4 text-green-500" />;
      case 'financial': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'team': return <Users className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Section */}
      <Card className="bg-gradient-card shadow-elegant border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Reports
          </CardTitle>
          <CardDescription>
            Create detailed reports to analyze your performance and track progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedReport === report.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <report.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{report.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.formats.map((fmt) => (
                        <Badge key={fmt} variant="outline" className="text-xs">
                          {fmt.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Report Configuration */}
          {selectedReport && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeRange">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes
                        .find(r => r.id === selectedReport)
                        ?.timeRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select value={format} onValueChange={(value: 'pdf' | 'csv' | 'excel') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes
                        .find(r => r.id === selectedReport)
                        ?.formats.map((fmt) => (
                          <SelectItem key={fmt} value={fmt}>
                            {fmt.toUpperCase()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating || !timeRange || !format}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Reports History */}
      <Card className="bg-gradient-card shadow-elegant border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report History
          </CardTitle>
          <CardDescription>
            View and download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{report.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {report.format} • {report.timestamp.toLocaleDateString()} {report.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={report.status === 'completed' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {report.status}
                    </Badge>
                    
                    {report.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(report.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats for Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Reports</p>
                <p className="text-2xl font-bold text-blue-600">{generatedReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {generatedReports.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {generatedReports.filter(r => {
                    const now = new Date();
                    const reportDate = new Date(r.timestamp);
                    return reportDate.getMonth() === now.getMonth() && 
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Download className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Downloads</p>
                <p className="text-2xl font-bold text-orange-600">
                  {generatedReports.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSection;
