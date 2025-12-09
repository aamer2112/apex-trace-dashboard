import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavLink } from "@/components/NavLink";
import { useBag } from "@/contexts/BagContext";
import { listBags, checkBackendHealth } from "@/lib/api";
import tufastLogo from "@/assets/tufast-logo.png";

const TopNav = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [backendBags, setBackendBags] = useState<string[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const { bags, setSelectedBagId } = useBag();

  const navItems = [
    { label: "Bags", path: "/" },
    { label: "Simulation", path: "/simulation" },
    { label: "Queue", path: "/queue" },
    { label: "Admin", path: "/admin" },
    { label: "Summary", path: "/summary" }
  ];

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      const health = await checkBackendHealth();
      setBackendConnected(!!health);
    };
    checkBackend();
  }, []);

  // Search both local and backend bags
  useEffect(() => {
    const searchBackend = async () => {
      if (searchQuery && backendConnected) {
        const result = await listBags(searchQuery);
        setBackendBags(result.bags);
      } else {
        setBackendBags([]);
      }
    };
    searchBackend();
  }, [searchQuery, backendConnected]);

  const filteredBags = bags.filter(bag => 
    bag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBagSelect = (bagId: string) => {
    setSelectedBagId(bagId);
    setSearchQuery("");
    setSearchOpen(false);
  };

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

        {/* Right: Search Bar */}
        <div className="flex items-center gap-2 relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search ROS2 bags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-8 text-sm bg-muted border-dashboard-border"
                  autoFocus
                />
                {searchQuery && filteredBags.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-card border border-dashboard-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredBags.map(bag => (
                      <button
                        key={bag.id}
                        onClick={() => handleBagSelect(bag.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{bag.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{bag.duration}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
