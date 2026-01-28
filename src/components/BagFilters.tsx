import { Search, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface BagFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  missionFilter: string;
  onMissionFilterChange: (mission: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

const MISSION_TYPES = [
  { value: "all", label: "All Missions" },
  { value: "autocross", label: "Autocross" },
  { value: "skidpad", label: "Skidpad" },
  { value: "acceleration", label: "Acceleration" },
  { value: "trackdrive", label: "Trackdrive" },
  { value: "endurance", label: "Endurance" },
  { value: "demo", label: "Demo" },
];

const BagFilters = ({
  searchQuery,
  onSearchChange,
  missionFilter,
  onMissionFilterChange,
  dateRange,
  onDateRangeChange,
}: BagFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background border-dashboard-border h-9"
        />
      </div>

      <div className="flex gap-2">
        {/* Mission Type Filter */}
        <Select value={missionFilter} onValueChange={onMissionFilterChange}>
          <SelectTrigger className="flex-1 h-9 bg-background border-dashboard-border">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Mission" />
          </SelectTrigger>
          <SelectContent className="bg-card border-dashboard-border z-50">
            {MISSION_TYPES.map((mission) => (
              <SelectItem key={mission.value} value={mission.value}>
                {mission.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 border-dashboard-border">
              <Calendar className="h-3.5 w-3.5 mr-2" />
              {dateRange.from ? (
                dateRange.to ? (
                  <span className="text-xs">
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                  </span>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                <span className="text-xs">Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-dashboard-border z-50" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={1}
              className="pointer-events-auto"
            />
            {(dateRange.from || dateRange.to) && (
              <div className="p-2 border-t border-dashboard-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default BagFilters;
