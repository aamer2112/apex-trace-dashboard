import { Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import tufastLogo from "@/assets/tufast-logo.png";

const TopNav = () => {
  const navItems = [
    { label: "Bags", path: "/" },
    { label: "Simulation", path: "/simulation" },
    { label: "Queue", path: "/queue" },
    { label: "Admin", path: "/admin" },
    { label: "Summary", path: "/summary" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-dashboard-border bg-dashboard-panel/95 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-4">
          <img src={tufastLogo} alt="TU Fast" className="h-7 w-auto" />
          <div className="h-6 w-px bg-dashboard-border" />
          <h1 className="text-sm font-semibold tracking-wider">
            ROSBAG-<span className="text-primary">APEXTRACE</span>
          </h1>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all"
              activeClassName="text-foreground bg-primary/10 border-b-2 border-primary"
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
