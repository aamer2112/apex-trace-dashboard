import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, Upload, Play, BarChart3, Settings, 
  Database, Zap, MousePointer, FileDown, FolderOpen,
  AlertCircle, Users
} from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpModal = ({ open, onOpenChange }: HelpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-dashboard-border max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <DialogTitle>APEXTRACE — User Guide</DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* What the tool does */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                What is APEXTRACE?
              </h3>
              <p className="text-muted-foreground">
                APEXTRACE is a web-based telemetry analysis tool for ROS2 bag files. It provides 
                automatic processing, visualization, and simulation of autonomous vehicle telemetry 
                data with an F1-style dashboard interface.
              </p>
            </section>

            {/* Demo Mode */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                Demo Mode
              </h3>
              <p className="text-muted-foreground mb-2">
                The application starts in demo mode with sample bags pre-loaded. Demo users can:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Upload up to 3 ROS2 bags</li>
                <li>View all telemetry and plots</li>
                <li>Run simulations</li>
                <li>Access Queue and Summary pages</li>
                <li>Delete demo bags (they won't reappear)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                For full admin access, use the "TUfast Admin Login" link.
              </p>
            </section>

            {/* How to upload */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                Uploading ROS2 Bags
              </h3>
              <p className="text-muted-foreground mb-2">
                Click the "Upload Bag" button in the sidebar to upload your ROS2 bag files.
              </p>
              <p className="text-muted-foreground font-medium">Supported formats:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>ROS2 bag format (.db3)</li>
                <li>SQLite3 storage backend</li>
                <li>MCAP storage backend</li>
              </ul>
            </section>

            {/* Automatic Processing */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Database className="h-4 w-4" />
                Automatic Processing
              </h3>
              <p className="text-muted-foreground">
                Once uploaded, bags are automatically sent to the processing queue. The system 
                extracts all topics, computes derived metrics (steering rate, energy consumption), 
                and generates preview thumbnails. Check the Queue page for processing status.
              </p>
            </section>

            {/* Switching Bags */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4" />
                Switching Between Bags
              </h3>
              <p className="text-muted-foreground">
                Click any bag in the left sidebar to select it. All dashboard views, plots, 
                and the simulation page will update to show data from the selected bag.
              </p>
            </section>

            {/* Topic Selector */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                Using the Topic Selector
              </h3>
              <p className="text-muted-foreground">
                Toggle topics (Steering, Speed, Torque, Brake, Throttle) using the buttons 
                above the plot area. Multiple topics can be overlaid on the same chart.
              </p>
            </section>

            {/* Plot Interactions */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <MousePointer className="h-4 w-4" />
                Plot Interactions (Foxglove-style)
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Scroll wheel:</strong> Zoom in/out centered at cursor</li>
                <li><strong>Drag slider:</strong> Pan through time</li>
                <li><strong>Click + drag:</strong> Select zoom range</li>
                <li><strong>Link button:</strong> Synchronize zoom across plots</li>
                <li><strong>Reset button:</strong> Return to full view</li>
              </ul>
            </section>

            {/* Simulation */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Play className="h-4 w-4" />
                Simulation Playback
              </h3>
              <p className="text-muted-foreground">
                The Simulation page provides synchronized replay of bag data with a 2D vehicle 
                visualization. Use play/pause, adjust playback speed (0.5x–4x), and scrub 
                through the timeline to analyze specific moments.
              </p>
            </section>

            {/* Export */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <FileDown className="h-4 w-4" />
                Exporting Data
              </h3>
              <p className="text-muted-foreground">
                Export processed data as CSV or Parquet from the dashboard. Select topics 
                and time ranges for targeted exports.
              </p>
            </section>

            {/* Pages */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                Application Pages
              </h3>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Bags:</strong> Main dashboard with quick-look metrics and telemetry plots</li>
                <li><strong className="text-foreground">Simulation:</strong> Real-time playback with vehicle visualization</li>
                <li><strong className="text-foreground">Queue:</strong> Processing status for uploaded bags</li>
                <li><strong className="text-foreground">Admin:</strong> System health and storage metrics</li>
                <li><strong className="text-foreground">Summary:</strong> Aggregate statistics across all bags</li>
              </ul>
            </section>

            {/* Issues */}
            <section>
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                Reporting Issues
              </h3>
              <p className="text-muted-foreground">
                For bugs, feature requests, or questions, please contact your TUfast Autonomous 
                Systems technical lead or open an issue on the project repository.
              </p>
            </section>

            {/* Credits */}
            <section className="border-t border-dashboard-border pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Credits:</strong> APEXTRACE was developed by Abdallah Amer (TUfast Racing Team – 
                Autonomous Systems). Architecture inspired by AMZ Racing's rbb_core project.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <a 
                  href="https://github.com/AMZ-Racing/rbb_core" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  → View AMZ rbb_core on GitHub
                </a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
