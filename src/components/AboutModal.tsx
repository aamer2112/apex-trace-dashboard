import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-dashboard-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <DialogTitle>About APEXTRACE</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="h-1 w-16 bg-primary rounded-full" />
          
          <p className="text-muted-foreground leading-relaxed">
            APEXTRACE is a web-based telemetry and analysis tool developed by{" "}
            <span className="text-foreground font-medium">Abdallah Amer</span>, 
            a member of the TUfast Racing Team – Autonomous Systems Subteam.
          </p>
          

          <div className="pt-4 border-t border-dashboard-border">
            <p className="text-xs text-muted-foreground">
              For questions, contributions, or feature requests, please contact 
              your TUfast Autonomous Systems technical lead.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;
