import React from 'react';

interface ActivityHeatmapProps {
  data: Record<string, number>;
  className?: string;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, className }) => {
  // Generate last 7 days in a proper grid format
  const generateHeatmapData = () => {
    const today = new Date();
    const days = [];
    
    // Start from 6 days ago to today
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      days.push({
        date: dateStr,
        count: data[dateStr] || 0,
        dayOfWeek,
        week: Math.floor((6 - i) / 7)
      });
    }
    
    return days;
  };

  const heatmapData = generateHeatmapData();
  const maxCount = Math.max(...Object.values(data), 1);
  
  // Handle case where there's no activity data
  const hasActivity = Object.values(data).some(count => count > 0);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-green-600 dark:bg-green-500';
    if (intensity > 0.6) return 'bg-green-500 dark:bg-green-400';
    if (intensity > 0.4) return 'bg-green-400 dark:bg-green-300';
    if (intensity > 0.2) return 'bg-green-300 dark:bg-green-200';
    return 'bg-green-200 dark:bg-green-100';
  };

  const getTooltip = (date: string, count: number) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
    return `${count} activities on ${formattedDate}`;
  };

  // Create a 7x1 grid (7 days x 1 week for 7 days)
  const weeks = 1;
  const daysPerWeek = 7;

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Activity over the last 7 days</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-100"></div>
            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-200"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-300"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400"></div>
            <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-6">
          {dayLabels.map((day, index) => (
            <div key={day} className="h-3 text-xs text-muted-foreground flex items-center justify-end pr-2">
              {index % 2 === 0 ? day : ''}
            </div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex gap-1">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
                const dayData = heatmapData[weekIndex * daysPerWeek + dayIndex];
                if (!dayData) return <div key={dayIndex} className="w-3 h-3"></div>;
                
                return (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-125 cursor-pointer ${getIntensity(dayData.count)}`}
                    title={getTooltip(dayData.date, dayData.count)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {hasActivity ? (
          <>Total activities: {Object.values(data).reduce((sum, count) => sum + count, 0).toLocaleString()}</>
        ) : (
          <>No activity recorded in the last 7 days</>
        )}
      </div>
    </div>
  );
};

export default ActivityHeatmap;