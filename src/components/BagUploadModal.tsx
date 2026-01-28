import { useState } from "react";
import { Upload, MapPin, Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BagUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: (metadata: { missionType: string; location: string }) => void;
  isUploading: boolean;
}

const MISSION_TYPES = [
  { value: "autocross", label: "Autocross" },
  { value: "skidpad", label: "Skidpad" },
  { value: "acceleration", label: "Acceleration" },
  { value: "trackdrive", label: "Trackdrive" },
  { value: "endurance", label: "Endurance" },
  { value: "demo", label: "Demo" },
];

const BagUploadModal = ({
  open,
  onOpenChange,
  file,
  onConfirm,
  isUploading,
}: BagUploadModalProps) => {
  const [missionType, setMissionType] = useState("autocross");
  const [location, setLocation] = useState("");

  const handleConfirm = () => {
    onConfirm({ missionType, location: location || "Unknown location" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-dashboard-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload ROS2 Bag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File name display */}
          <div className="p-3 rounded-lg bg-muted/50 border border-dashboard-border">
            <p className="text-xs text-muted-foreground mb-1">Selected file</p>
            <p className="text-sm font-medium truncate">{file?.name || "No file selected"}</p>
          </div>

          {/* Mission Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              Mission Type
            </Label>
            <Select value={missionType} onValueChange={setMissionType}>
              <SelectTrigger className="bg-background border-dashboard-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-dashboard-border z-50">
                {MISSION_TYPES.map((mission) => (
                  <SelectItem key={mission.value} value={mission.value}>
                    {mission.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Test / Competition Location
            </Label>
            <Input
              placeholder="e.g., Hockenheimring, Munich Test Track"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-dashboard-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BagUploadModal;
