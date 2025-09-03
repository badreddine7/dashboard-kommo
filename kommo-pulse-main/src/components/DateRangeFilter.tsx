import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isAfter, startOfDay, endOfDay } from 'date-fns';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onDateRangeChange, 
  className 
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
    onDateRangeChange(thirtyDaysAgo, today);
  }, []);

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from) return;
    
    const newStartDate = startOfDay(range.from);
    let newEndDate = endDate;
    
    if (range.to) {
      newEndDate = endOfDay(range.to);
    } else {
      // If only start date selected, set end date to start + 30 days as default
      newEndDate = endOfDay(addDays(newStartDate, 30));
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    onDateRangeChange(newStartDate, newEndDate);
    setIsOpen(false);
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const start = subDays(today, days - 1);
    setStartDate(start);
    setEndDate(today);
    onDateRangeChange(start, today);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    // Allow user to select any custom date range
    setIsOpen(true);
  };

  const clearDates = () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
    onDateRangeChange(thirtyDaysAgo, today);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select dates';
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, 'MMM dd, yyyy');
    }
    
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`;
  };

  const getDateRangeInfo = () => {
    if (!startDate || !endDate) return '';
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysDiff} days`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[200px]",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Select Date Range</h4>
                <p className="text-xs text-muted-foreground mt-1">Choose any date range</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDates}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            
            {/* Quick Select Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(7)}
                className="h-8 text-xs"
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(14)}
                className="h-8 text-xs"
              >
                Last 14 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(30)}
                className="h-8 text-xs"
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomRange}
                className="h-8 text-xs"
              >
                Custom Range
              </Button>
            </div>
            
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={startDate || undefined}
              selected={{
                from: startDate || undefined,
                to: endDate || undefined,
              }}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Only disable future dates
                return isAfter(date, new Date());
              }}
              numberOfMonths={1}
              className="rounded-md border-0"
            />
            
            {/* Date Range Info */}
            {startDate && endDate && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground text-center">
                <span className="font-medium">{getDateRangeInfo()}</span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Clear Button */}
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDates}
          className="h-8 w-8 p-0"
          title="Reset to last 30 days"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
