import { useState, useRef } from "react";
import { Upload, Database, Clock, Hash, Info, HelpCircle, Trash2, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBag } from "@/contexts/BagContext";
import { useBackendBags } from "@/hooks/useBackendBags";
import AboutModal from "./AboutModal";
import HelpModal from "./HelpModal";
import { toast } from "sonner";

const BagSidebar = () => {
  const { selectedBagId, setSelectedBagId, bags, deleteBag, addBag } = useBag();
  const { backendBags, isConnected, upload, remove, isLoading: backendLoading, refresh } = useBackendBags();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    if (isConnected) {
      // Upload to backend
      const success = await upload(file);
      if (success) {
        // Add to local context as well
        const newBag = {
          id: `backend-${Date.now()}`,
          name: file.name,
          timestamp: new Date().toLocaleString(),
          topics: 5,
          duration: "00:00",
          isDemo: false
        };
        addBag(newBag);
        setSelectedBagId(newBag.id);
        toast.success(`Uploaded ${file.name}`);
      } else {
        toast.error("Failed to upload bag to backend");
      }
    } else {
      // Local-only mode
      const newBag = {
        id: `local-${Date.now()}`,
        name: file.name,
        timestamp: new Date().toLocaleString(),
        topics: 5,
        duration: "00:00",
        isDemo: false
      };
      addBag(newBag);
      setSelectedBagId(newBag.id);
      toast.success(`Added ${file.name} (offline mode)`);
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent, bagId: string, bagName: string) => {
    e.stopPropagation();
    
    if (isConnected) {
      const success = await remove(bagName);
      if (success) {
        deleteBag(bagId);
        toast.success("Bag deleted from server");
      } else {
        // Still delete locally
        deleteBag(bagId);
        toast.info("Bag removed locally");
      }
    } else {
      deleteBag(bagId);
      toast.success("Bag deleted");
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".db3,.mcap,.bag"
        className="hidden"
      />
      
      <aside className="fixed left-0 top-14 bottom-0 w-80 bg-card border-r border-dashboard-border flex flex-col">
        <div className="p-4 border-b border-dashboard-border">
          <Button onClick={handleUploadClick} className="w-full glow-orange" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Bag
              </>
            )}
          </Button>
          
          {/* Connection status */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-accent" />
                  <span className="text-accent">Backend connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Offline mode</span>
                </>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Uploaded Bags
            </h3>
            
            {bags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No bags uploaded yet
              </p>
            ) : (
              bags.map((bag) => (
                <div
                  key={bag.id}
                  onClick={() => setSelectedBagId(bag.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                    selectedBagId === bag.id
                      ? "bg-primary/10 border-primary/50"
                      : "bg-background border-dashboard-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[180px]">
                        {bag.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(e, bag.id, bag.name)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{bag.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span>{bag.topics} topics</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {bag.timestamp}
                  </p>
                  
                  {bag.isDemo && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Demo
                    </span>
                  )}

                  {/* Mini sparkline placeholder */}
                  <div className="mt-3 h-8 bg-dashboard-grid rounded overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 32" preserveAspectRatio="none">
                      <path
                        d="M 0,16 Q 25,8 50,16 T 100,16 Q 125,24 150,16 T 200,16"
                        stroke="hsl(var(--primary))"
                        strokeWidth="1.5"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Bottom buttons */}
        <div className="p-4 border-t border-dashboard-border space-y-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={() => setAboutOpen(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              About
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
      </aside>

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default BagSidebar;
