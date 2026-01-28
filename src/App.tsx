import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BagProvider } from "@/contexts/BagContext";
import Index from "./pages/Index";
import Simulation from "./pages/Simulation";
import Queue from "./pages/Queue";
import Admin from "./pages/Admin";
import Summary from "./pages/Summary";
import BagSummary from "./pages/BagSummary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BagProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Summary is the homepage */}
            <Route path="/" element={<Summary />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/bag-summary" element={<BagSummary />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/summary" element={<Summary />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BagProvider>
  </QueryClientProvider>
);

export default App;
