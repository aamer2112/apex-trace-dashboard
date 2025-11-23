import { RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";

interface QueueItem {
  id: string;
  bagName: string;
  status: "uploaded" | "processing" | "done" | "error";
  progress: number;
  timestamp: string;
  error?: string;
}

const queueItems: QueueItem[] = [
  {
    id: "1",
    bagName: "skidpad_run_001.db3",
    status: "done",
    progress: 100,
    timestamp: "2025-11-22 14:30",
  },
  {
    id: "2",
    bagName: "autocross_lap_003.db3",
    status: "done",
    progress: 100,
    timestamp: "2025-11-22 11:15",
  },
  {
    id: "3",
    bagName: "endurance_test_045.db3",
    status: "processing",
    progress: 67,
    timestamp: "2025-11-21 16:42",
  },
];

const Queue = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case "processing":
        return <RefreshCw className="h-5 w-5 text-primary animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      done: "default",
      processing: "secondary",
      error: "destructive",
      uploaded: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Processing Queue</h2>
            <p className="text-sm text-muted-foreground">
              Background extraction and processing status
            </p>
          </div>

          <Card className="p-6 bg-card border-dashboard-border">
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-dashboard-border bg-dashboard-grid hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium font-telemetry truncate">
                          {item.bagName}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      {item.status === "processing" && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Extracting topics and computing metrics... {item.progress}%
                          </p>
                        </div>
                      )}
                      
                      {item.error && (
                        <p className="text-xs text-destructive">{item.error}</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.timestamp}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {item.status === "error" && (
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Queue;
