import { useState } from "react";
import { FileText, Clock, Database, Info, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBag } from "@/contexts/BagContext";

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
  const { selectedBagId, setSelectedBagId } = useBag();
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
                onClick={() => setSelectedBagId(bag.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-muted/30 group ${
                  selectedBagId === bag.id
                    ? 'border-primary bg-primary/5' 
                    : 'border-dashboard-border bg-card'
                }`}
              >
                {/* Bag Name */}
                <div className="flex items-start gap-2 mb-2">
                  <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${selectedBagId === bag.id ? 'text-primary' : 'text-muted-foreground'}`} />
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

        {/* Bottom Actions */}
        <div className="p-3 border-t border-dashboard-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => setShowAbout(true)}
          >
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* About Modal */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-lg bg-card border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-1 w-8 bg-primary rounded-full" />
              About APEXTRACE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              This web-based telemetry and analysis tool was designed and developed by{" "}
              <span className="font-semibold text-primary">Abdallah Amer</span>, member of the{" "}
              <span className="font-semibold">TUfast Racing Team – Autonomous Systems Subteam</span>.
            </p>
            <p>
              <span className="font-semibold">APEXTRACE</span> provides automated processing, visualization 
              and simulation of ROS2 bag data, built on modern F1-style design language and leveraging 
              AMZ Racing's rbb_core architecture.
            </p>
            <p className="text-muted-foreground text-xs">
              For questions, contributions or feature requests, please contact your TUfast Autonomous 
              Systems technical lead.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl bg-card border-dashboard-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-1 w-8 bg-primary rounded-full" />
              APEXTRACE — User Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">What APEXTRACE Does</h3>
              <p className="text-muted-foreground">
                APEXTRACE is an automatic ROS2 bag processing and visualization platform for telemetry analysis. 
                Upload bags, extract all topics, view synchronized plots, replay simulations, and export data.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">How to Upload ROS2 Bags</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Click the upload button in the main dashboard</li>
                <li>Select one or multiple .db3 ROS2 bag files</li>
                <li>Files are automatically queued for processing</li>
                <li>Track progress in the Queue page</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">Supported Formats</h3>
              <p className="text-muted-foreground">
                ROS2 bag files with sqlite3 storage backend (.db3). All standard ROS2 message types are supported.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">Navigation</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><span className="font-semibold text-foreground">Bags</span> — Select and inspect uploaded rosbags</li>
                <li><span className="font-semibold text-foreground">Simulation</span> — View synchronized playback with 2D vehicle visualization</li>
                <li><span className="font-semibold text-foreground">Queue</span> — Monitor background processing status</li>
                <li><span className="font-semibold text-foreground">Admin</span> — System health and storage metrics</li>
                <li><span className="font-semibold text-foreground">Summary</span> — Aggregate analytics across all bags</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">Topic Selection</h3>
              <p className="text-muted-foreground">
                Use the topic selector buttons above plots to toggle between steering, speed, torque, brake, and throttle channels. 
                Multiple topics can be overlaid for comparison.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">Data Export</h3>
              <p className="text-muted-foreground">
                Export processed data as CSV or Parquet for selected topics and time ranges. Use the export button in the telemetry view.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 text-primary">Report Issues</h3>
              <p className="text-muted-foreground">
                Contact the TUfast Autonomous Systems team lead for bug reports or feature requests.
              </p>
            </section>

            <div className="pt-4 border-t border-dashboard-border">
              <p className="text-xs text-muted-foreground">
                © 2025 TUfast Racing Team — Autonomous Systems Subteam. Built with AMZ rbb_core integration.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BagSidebar;
