import { useState, useRef, useMemo } from "react";
import { Upload, Database, Clock, Info, HelpCircle, Trash2, Loader2, Wifi, WifiOff, Car, Flag, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBag, getLapsForBag } from "@/contexts/BagContext";
import { useBackendBags } from "@/hooks/useBackendBags";
import { useNavigate } from "react-router-dom";
import AboutModal from "./AboutModal";
import HelpModal from "./HelpModal";
import BagFilters from "./BagFilters";
import BagUploadModal from "./BagUploadModal";
import { toast } from "sonner";

const BagSidebar = () => {
  const { selectedBagId, setSelectedBagId, bags, deleteBag, addBag } = useBag();
  const { isConnected, upload, remove } = useBackendBags();
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [expandedBagId, setExpandedBagId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [missionFilter, setMissionFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Filter bags based on search, mission, and date
  const filteredBags = useMemo(() => {
    return bags.filter((bag) => {
      // Search filter
      if (searchQuery && !bag.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Mission filter
      if (missionFilter !== "all" && bag.missionType !== missionFilter) {
        return false;
      }
      // Date filter (simplified - in real app would parse bag.timestamp)
      // For now, we skip date filtering on demo data
      return true;
    });
  }, [bags, searchQuery, missionFilter, dateRange]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPendingFile(file);
    setUploadModalOpen(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadConfirm = async (metadata: { missionType: string; location: string }) => {
    if (!pendingFile) return;
    
    setUploading(true);
    
    const newBag = {
      id: `${isConnected ? 'backend' : 'local'}-${Date.now()}`,
      name: pendingFile.name,
      timestamp: new Date().toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      topics: 5,
      duration: "00:00",
      isDemo: false,
      missionType: metadata.missionType,
      location: metadata.location,
      uploadDate: new Date(),
      drivenDistance: 0, // Will be calculated from telemetry
    };

    if (isConnected) {
      const success = await upload(pendingFile);
      if (success) {
        addBag(newBag);
        setSelectedBagId(newBag.id);
        toast.success(`Uploaded ${pendingFile.name}`);
      } else {
        toast.error("Failed to upload bag to backend");
      }
    } else {
      addBag(newBag);
      setSelectedBagId(newBag.id);
      toast.success(`Added ${pendingFile.name} (offline mode)`);
    }
    
    setUploading(false);
    setUploadModalOpen(false);
    setPendingFile(null);
  };

  const handleDelete = async (e: React.MouseEvent, bagId: string, bagName: string) => {
    e.stopPropagation();
    
    if (isConnected) {
      const success = await remove(bagName);
      if (success) {
        deleteBag(bagId);
        toast.success("Bag deleted from server");
      } else {
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
        <div className="p-4 border-b border-dashboard-border space-y-3">
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
          <div className="flex items-center justify-between">
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

          {/* Filters */}
          <BagFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            missionFilter={missionFilter}
            onMissionFilterChange={setMissionFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Uploaded Bags ({filteredBags.length})
            </h3>
            
            {filteredBags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {bags.length === 0 ? "No bags uploaded yet" : "No bags match filters"}
              </p>
            ) : (
              filteredBags.map((bag) => {
                const laps = getLapsForBag(bag);
                const isExpanded = expandedBagId === bag.id;
                
                return (
                  <div key={bag.id} className="space-y-1">
                    <div
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
                      
                      {/* Mission type badge */}
                      {bag.missionType && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Flag className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                            {bag.missionType}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Stats - Show driven distance instead of duration/topics */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          <span className="font-telemetry">
                            {bag.drivenDistance?.toFixed(2) || "0.00"} km
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{bag.duration}</span>
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

                      {/* Lap dropdown toggle */}
                      {laps.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedBagId(isExpanded ? null : bag.id);
                          }}
                          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-full"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span>{laps.length} Lap{laps.length > 1 ? "s" : ""}</span>
                          <Shield className="h-3 w-3 ml-auto" />
                        </button>
                      )}
                    </div>
                    
                    {/* Lap list dropdown */}
                    {isExpanded && laps.length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-primary/30 space-y-1">
                        {laps.map((lap) => (
                          <button
                            key={lap}
                            onClick={() => {
                              setSelectedBagId(bag.id);
                              navigate(`/lap-confidence?lap=${lap}`);
                            }}
                            className="w-full p-2 text-left text-xs rounded bg-muted/30 hover:bg-primary/10 transition-colors flex items-center justify-between group"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-telemetry">Lap {lap}</span>
                              {bag.missionType === "skidpad" && (lap === "3" || lap === "5") && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  Key
                                </Badge>
                              )}
                            </span>
                            <Shield className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
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
      <BagUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        file={pendingFile}
        onConfirm={handleUploadConfirm}
        isUploading={uploading}
      />
    </>
  );
};

export default BagSidebar;
