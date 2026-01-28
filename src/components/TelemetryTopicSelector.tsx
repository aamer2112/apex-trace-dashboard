import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TelemetryTopic {
  id: string;
  label: string;
  unit: string;
  color: string;
  yAxisId: "left" | "right"; // For dual Y-axis support
}

const AVAILABLE_TOPICS: TelemetryTopic[] = [
  { id: "steering", label: "Steering Angle", unit: "deg", color: "#FF5400", yAxisId: "left" },
  { id: "speed", label: "Vehicle Speed", unit: "m/s", color: "#00C2A8", yAxisId: "left" },
  { id: "force", label: "Longitudinal Force", unit: "N", color: "#FFD700", yAxisId: "right" },
  { id: "brake", label: "Brake Pressure", unit: "%", color: "#FF4444", yAxisId: "left" },
  { id: "yaw_moment", label: "Yaw Moment", unit: "Nm", color: "#9B59B6", yAxisId: "right" },
  { id: "acceleration", label: "Acceleration", unit: "m/s²", color: "#3498DB", yAxisId: "left" },
  { id: "slip_angle", label: "Slip Angle", unit: "deg", color: "#E91E63", yAxisId: "left" },
];

interface TelemetryTopicSelectorProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
}

const TelemetryTopicSelector = ({
  selectedTopics,
  onTopicsChange,
}: TelemetryTopicSelectorProps) => {
  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onTopicsChange(selectedTopics.filter((t) => t !== topicId));
    } else {
      onTopicsChange([...selectedTopics, topicId]);
    }
  };

  const removeTopic = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTopicsChange(selectedTopics.filter((t) => t !== topicId));
  };

  const selectedTopicData = AVAILABLE_TOPICS.filter((t) =>
    selectedTopics.includes(t.id)
  );

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto min-h-[40px] py-2 border-dashboard-border bg-background"
          >
            <span className="text-sm text-muted-foreground">
              {selectedTopics.length === 0
                ? "Select telemetry topics..."
                : `${selectedTopics.length} topic${selectedTopics.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 bg-card border-dashboard-border z-50"
          align="start"
        >
          <div className="p-2 border-b border-dashboard-border">
            <p className="text-xs text-muted-foreground">
              Select multiple topics to compare
            </p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{topic.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {topic.unit} • {topic.yAxisId === "left" ? "Left axis" : "Right axis"}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected topics badges */}
      {selectedTopicData.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTopicData.map((topic) => (
            <Badge
              key={topic.id}
              variant="outline"
              className="pl-1.5 pr-1 py-0.5 text-xs gap-1.5 border-dashboard-border"
              style={{ borderColor: topic.color, color: topic.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: topic.color }}
              />
              {topic.label}
              <span className="text-muted-foreground">({topic.unit})</span>
              <button
                onClick={(e) => removeTopic(topic.id, e)}
                className="ml-0.5 hover:bg-muted/50 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export { AVAILABLE_TOPICS };
export default TelemetryTopicSelector;
