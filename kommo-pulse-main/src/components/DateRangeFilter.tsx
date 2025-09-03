import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

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
  }, []); // Remove onDateRangeChange dependency to avoid infinite loop

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const newStartDate = startOfDay(date);
    const maxEndDate = addDays(newStartDate, 30);
    
    setStartDate(newStartDate);
    
    // If end date is more than 30 days from start date, adjust it
    if (endDate && isAfter(endDate, maxEndDate)) {
      setEndDate(maxEndDate);
      onDateRangeChange(newStartDate, maxEndDate);
    } else if (endDate) {
      onDateRangeChange(newStartDate, endDate);
    } else {

        // Set end date to start date + 30 days if no end date is set
      const defaultEndDate = addDays(newStartDate, 30);
      setEndDate(defaultEndDate);
      onDateRangeChange(newStartDate, defaultEndDate);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const newEndDate = endOfDay(date);
    
    // Ensure end date is not more than 30 days from start date
    if (startDate && isAfter(newEndDate, addDays(startDate, 30))) {
      const maxEndDate = addDays(startDate, 30);
      setEndDate(maxEndDate);
      onDateRangeChange(startDate, maxEndDate);
    } else {
      setEndDate(newEndDate);
      onDateRangeChange(startDate, newEndDate);
    }
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const start = subDays(today, days - 1);
    setStartDate(start);
    setEndDate(today);
    onDateRangeChange(start, today);
    setIsOpen(false);
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
    
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  };

  const getDateRangeInfo = () => {
    if (!startDate || !endDate) return '';
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Select Date Range</h4>
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
            <div className="flex flex-wrap gap-1 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(7)}
                className="h-7 px-2 text-xs"
              >
                7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(14)}
                className="h-7 px-2 text-xs"
              >
                14 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(30)}
                className="h-7 px-2 text-xs"
              >
                30 days
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
              onSelect={(range) => {
                if (range?.from) {
                  handleStartDateSelect(range.from);
                }
                if (range?.to) {
                  handleEndDateSelect(range.to);
                }
              }}
              disabled={(date) => {
                // Disable dates more than 30 days from start date
                if (startDate) {
                  return isAfter(date, addDays(startDate, 30));
                }
                // Disable future dates
                return isAfter(date, new Date());
              }}
              numberOfMonths={2}
            />
            
            {/* Date Range Info */}
            {startDate && endDate && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Range:</span>
                  <span className="font-medium">{getDateRangeInfo()}</span>
                </div>
                <div className="text-xs mt-1">
                  Max: 30 days from start date
                </div>
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
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
