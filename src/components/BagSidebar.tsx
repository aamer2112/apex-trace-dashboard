import { FileText, Clock, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BagItem {
  id: string;
  name: string;
  size: string;
  duration: string;
  topics: number;
  timestamp: string;
  tags: string[];
}

const sampleBags: BagItem[] = [
  {
    id: "1",
    name: "skidpad_run_001.db3",
    size: "2.3 GB",
    duration: "10:52",
    topics: 47,
    timestamp: "2025-11-22 14:30",
    tags: ["GPS", "IMU"]
  },
  {
    id: "2",
    name: "autocross_lap_003.db3",
    size: "1.8 GB",
    duration: "08:15",
    topics: 52,
    timestamp: "2025-11-22 11:15",
    tags: ["GPS", "IMU", "Power"]
  },
  {
    id: "3",
    name: "endurance_test_045.db3",
    size: "5.7 GB",
    duration: "22:08",
    topics: 51,
    timestamp: "2025-11-21 16:42",
    tags: ["GPS", "IMU", "Power"]
  }
];

const BagSidebar = () => {
  return (
    <div className="fixed left-0 top-14 bottom-0 w-80 border-r border-dashboard-border bg-dashboard-panel">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-dashboard-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded Bags
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {sampleBags.length} bags available
          </p>
        </div>

        {/* Bag List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {sampleBags.map((bag, idx) => (
              <button
                key={bag.id}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-muted/30 group ${
                  idx === 0 
                    ? 'border-primary bg-primary/5' 
                    : 'border-dashboard-border bg-card'
                }`}
              >
                {/* Bag Name */}
                <div className="flex items-start gap-2 mb-2">
                  <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium font-telemetry leading-tight break-all">
                    {bag.name}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {bag.duration}
                    </span>
                    <span className="font-telemetry">{bag.size}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Database className="h-3 w-3" />
                    <span>{bag.topics} topics</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bag.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-[10px] text-muted-foreground mt-2 font-telemetry">
                  {bag.timestamp}
                </div>

                {/* Mini sparkline placeholder */}
                <div className="mt-2 h-8 bg-muted/20 rounded border border-dashboard-border/50 overflow-hidden">
                  <div className="h-full w-full" style={{
                    background: `linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.2) 30%, hsl(var(--primary) / 0.4) 50%, hsl(var(--primary) / 0.2) 70%, transparent 100%)`
                  }} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BagSidebar;
