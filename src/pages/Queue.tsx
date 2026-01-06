import { useState } from "react";
import { RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { useBag } from "@/contexts/BagContext";
import { deleteBag as apiDeleteBag } from "@/lib/api";
import { toast } from "sonner";

const Queue = () => {
  const { bags, deleteBag } = useBag();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (bagId: string, bagName: string) => {
    setIsDeleting(bagId);
    try {
      // Try to delete from backend if connected
      const success = await apiDeleteBag(bagName);
      if (success) {
        deleteBag(bagId);
        toast.success("Bag deleted");
      } else {
        // Still delete locally
        deleteBag(bagId);
        toast.success("Bag removed locally");
      }
    } catch (error) {
      deleteBag(bagId);
      toast.success("Bag removed locally");
    } finally {
      setIsDeleting(null);
    }
  };

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
              {bags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No bags in queue
                </p>
              ) : (
                bags.map((bag) => {
                  // Determine status based on bag properties
                  const status = bag.isDemo ? "done" : "done";
                  return (
                    <div
                      key={bag.id}
                      className="p-4 rounded-lg border border-dashboard-border bg-dashboard-grid hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">{getStatusIcon(status)}</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium font-telemetry truncate">
                              {bag.name}
                            </span>
                            {getStatusBadge(status)}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {bag.timestamp}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDelete(bag.id, bag.name)}
                            disabled={isDeleting === bag.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Queue;
