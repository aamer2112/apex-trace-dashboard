import { Server, Database, HardDrive, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">System Administration</h2>
            <p className="text-sm text-muted-foreground">
              Server health, storage, and system metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Server Status", value: "Online", icon: <Server className="h-5 w-5" />, color: "text-accent" },
              { label: "Database", value: "Healthy", icon: <Database className="h-5 w-5" />, color: "text-accent" },
              { label: "Storage Used", value: "12.4 GB", icon: <HardDrive className="h-5 w-5" />, color: "text-primary" },
              { label: "Active Jobs", value: "1", icon: <Activity className="h-5 w-5" />, color: "text-primary" }
            ].map((metric) => (
              <Card key={metric.label} className="p-4 bg-card border-dashboard-border">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-primary/10 ${metric.color}`}>
                    {metric.icon}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {metric.label}
                </p>
                <span className="text-2xl font-bold font-telemetry">{metric.value}</span>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-card border-dashboard-border mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Storage Distribution
            </h3>
            <div className="space-y-3">
              {[
                { label: "Raw Bags", size: "10.1 GB", percent: 81 },
                { label: "Processed Data", size: "1.8 GB", percent: 15 },
                { label: "Cache", size: "0.5 GB", percent: 4 }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-telemetry">{item.size}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              System Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Backend Version", "v1.2.3"],
                ["rbb_core Version", "v2.1.0"],
                ["Database", "PostgreSQL 15"],
                ["Storage Backend", "MinIO"],
                ["Queue System", "Redis"],
                ["Python Version", "3.11.5"]
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-dashboard-border">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-telemetry">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
