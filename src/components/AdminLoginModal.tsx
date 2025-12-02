import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBag } from "@/contexts/BagContext";
import { toast } from "sonner";
import { Shield, Mail, Key } from "lucide-react";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminLoginModal = ({ open, onOpenChange }: AdminLoginModalProps) => {
  const { setAdminLoggedIn } = useBag();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.endsWith("@tufast.de") && !email.endsWith("@tum.de")) {
      toast.error("Please use a valid TUfast or TUM email address");
      return;
    }
    setIsLoading(true);
    // Simulate sending verification code
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep("verify");
    toast.success("Verification code sent to your email");
  };

  const handleVerify = async () => {
    setIsLoading(true);
    // Simulate verification (accept any 6-digit code for demo)
    await new Promise(resolve => setTimeout(resolve, 800));
    if (code.length === 6) {
      setAdminLoggedIn(true);
      toast.success("Admin access granted!");
      onOpenChange(false);
      setStep("email");
      setEmail("");
      setCode("");
    } else {
      toast.error("Invalid verification code");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-dashboard-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>TUfast Admin Login</DialogTitle>
          </div>
          <DialogDescription>
            Sign in with your TUfast email to gain full admin privileges.
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                TUfast Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.name@tufast.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-dashboard-border"
              />
              <p className="text-xs text-muted-foreground">
                Only @tufast.de and @tum.de emails are accepted
              </p>
            </div>
            <Button 
              onClick={handleSendCode} 
              className="w-full"
              disabled={!email || isLoading}
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-background border-dashboard-border font-telemetry text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Check {email} for the verification code
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("email")}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerify} 
                className="flex-1"
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-dashboard-border">
          <p className="text-xs text-muted-foreground text-center">
            Demo users can access all features except admin settings.
            <br />
            Admin login is optional.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginModal;
