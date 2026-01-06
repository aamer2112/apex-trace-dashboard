import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroBackground from "@/components/HeroBackground";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import QuickLookDashboard from "@/components/QuickLookDashboard";
import { useBag } from "@/contexts/BagContext";
import tufastLogo from "@/assets/tufast-logo.png";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const { selectedBagId, bags } = useBag();
  const currentBag = bags.find(bag => bag.id === selectedBagId) || bags[0];

  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <HeroBackground />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center max-w-4xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Welcome to{" "}
              <span className="text-primary">ROSBAG-APEXTRACE</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 tracking-wide">
              From upload to insight — every ROS2-bag processed automatically.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 glow-orange"
                onClick={() => setShowDashboard(true)}
              >
                <Upload className="mr-2 h-5 w-5" />
                Enter Dashboard
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
                <span>Automatic Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-glow-pulse" />
                <span>Quick Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
                <span>Deep Analysis</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {currentBag.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Uploaded {currentBag.timestamp} • {currentBag.topics} topics • {currentBag.duration} duration
            </p>
          </div>

          <QuickLookDashboard />
        </div>
      </main>
    </div>
  );
};

export default Index;
