import * as React from "react"
import { addDays, addMonths, addHours, startOfDay, startOfHour, format, isWithinInterval } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface TimeRangePickerProps {
  className?: string
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  referenceDate?: Date
  isLoading?: boolean
}

const timeRanges = [
  // NEW: Hourly time ranges
  { 
    label: "Last 6 Hours", 
    value: "6h", 
    getDates: (ref: Date) => ({ 
      from: addHours(startOfHour(ref), -6), 
      to: ref 
    }),
    isHourly: true
  },
  { 
    label: "Last 12 Hours", 
    value: "12h", 
    getDates: (ref: Date) => ({ 
      from: addHours(startOfHour(ref), -12), 
      to: ref 
    }),
    isHourly: true
  },
  { 
    label: "Last 24 Hours", 
    value: "24h", 
    getDates: (ref: Date) => ({ 
      from: addHours(startOfHour(ref), -24), 
      to: ref 
    }),
    isHourly: true
  },
  { 
    label: "Last 3 Days", 
    value: "3d", 
    getDates: (ref: Date) => ({ 
      from: addDays(startOfDay(ref), -3), 
      to: ref 
    }),
    isHourly: true
  },
  
  // Existing daily time ranges
  { 
    label: "1 Week", 
    value: "1w", 
    getDates: (ref: Date) => ({ 
      from: addDays(startOfDay(ref), -7), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "1 Month", 
    value: "1m", 
    getDates: (ref: Date) => ({ 
      from: addMonths(startOfDay(ref), -1), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "3 Months", 
    value: "3m", 
    getDates: (ref: Date) => ({ 
      from: addMonths(startOfDay(ref), -3), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "6 Months", 
    value: "6m", 
    getDates: (ref: Date) => ({ 
      from: addMonths(startOfDay(ref), -6), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "1 Year", 
    value: "1y", 
    getDates: (ref: Date) => ({ 
      from: addMonths(startOfDay(ref), -12), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "2 Years", 
    value: "2y", 
    getDates: (ref: Date) => ({ 
      from: addMonths(startOfDay(ref), -24), 
      to: ref 
    }),
    isHourly: false
  },
  { 
    label: "All Time", 
    value: "all", 
    getDates: (ref: Date) => ({ 
      from: new Date(2020, 0, 1), 
      to: ref 
    }),
    isHourly: false
  },
]

export function TimeRangePicker({
  className,
  value,
  onChange,
  referenceDate = new Date(),
  isLoading = false
}: TimeRangePickerProps) {
  const handleChange = (selectedValue: string) => {
    const range = timeRanges.find(r => r.value === selectedValue);
    if (range) {
      const dates = range.getDates(referenceDate);
      onChange(dates);
    }
  };

  const getCurrentValue = () => {
    if (!value?.from || !value?.to) return "1w";
    
    // Compare with each range's dates
    for (const range of timeRanges) {
      const rangeDates = range.getDates(value.to);
      const tolerance = range.isHourly ? 1000 * 60 * 5 : 1000 * 60 * 60; // 5 min for hourly, 1 hour for daily
      
      if (
        Math.abs(rangeDates.from.getTime() - value.from.getTime()) < tolerance &&
        Math.abs(rangeDates.to.getTime() - value.to.getTime()) < tolerance
      ) {
        return range.value;
      }
    }
    return "1w";
  };

  const formatDateRange = (dates: DateRange | undefined) => {
    if (!dates) return '';
    return `${format(dates.from, 'dd/MM')} - ${format(dates.to, 'dd/MM')}`;
  };

  // Group ranges for better UI
  const hourlyRanges = timeRanges.filter(r => r.isHourly);
  const dailyRanges = timeRanges.filter(r => !r.isHourly);

  return (
    <Select onValueChange={handleChange} value={getCurrentValue()} disabled={isLoading}>
      <SelectTrigger className={cn(
        "w-[140px] transition-all duration-200",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SelectValue placeholder="Time Range" />
        )}
      </SelectTrigger>
      <SelectContent>
        {/* Hourly ranges section */}
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Hourly Data
        </div>
        {hourlyRanges.map((range) => (
          <SelectItem 
            key={range.value} 
            value={range.value} 
            className="!p-2 [&_svg]:hidden"
          >
            {range.label}
          </SelectItem>
        ))}
        
        {/* Separator */}
        <div className="border-t my-1" />
        
        {/* Daily ranges section */}
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Daily Data
        </div>
        {dailyRanges.map((range) => (
          <SelectItem 
            key={range.value} 
            value={range.value} 
            className="!p-2 [&_svg]:hidden"
          >
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}