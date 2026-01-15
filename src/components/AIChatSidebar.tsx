import { useState, useRef, useEffect } from "react";
import { X, Send, Zap, HelpCircle, BarChart3, Paperclip, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBag } from "@/contexts/BagContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import carIcon from "@/assets/car-icon.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const availableModels = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", description: "Fast & efficient" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Balanced performance" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Most capable" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "OpenAI balanced" },
  { id: "openai/gpt-5", name: "GPT-5", description: "OpenAI powerful" },
];

const suggestedPrompts = [
  { icon: HelpCircle, text: "How do I upload a ROS2 bag file?" },
  { icon: BarChart3, text: "What telemetry data can I analyze?" },
  { icon: Zap, text: "Explain the Simulation view" },
];

export const AIChatSidebar = ({ isOpen, onClose }: AIChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { bags, selectedBagId } = useBag();
  const location = useLocation();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContext = () => ({
    currentPage: location.pathname,
    selectedBag: selectedBagId ? bags.find(b => b.id === selectedBagId)?.name : null,
    bagsCount: bags.length,
    backendConnected: true,
  });

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: getContext(),
          model: selectedModel.id,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ""),
        { role: "assistant", content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Please try again."}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Chat Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[480px] bg-card z-50 flex flex-col shadow-2xl border-l border-dashboard-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <img src={carIcon} alt="APEXTRACE AI" className="w-8 h-5 object-contain" />
                <span className="font-semibold">APEXTRACE AI</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-muted">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Model Selector */}
            <div className="px-4 py-3 border-b border-dashboard-border">
              <div className="relative">
                <button
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-dashboard-border hover:bg-muted transition-colors text-sm"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedModel.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedModel.description}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {modelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-dashboard-border rounded-lg shadow-lg overflow-hidden z-10"
                    >
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model);
                            setModelDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                          {selectedModel.id === model.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-12">
                    {/* Welcome Icon */}
                    <div className="relative mb-6">
                      <img src={carIcon} alt="APEXTRACE" className="w-20 h-12 object-contain opacity-60" />
                    </div>
                    
                    {/* Welcome Text */}
                    <h3 className="text-lg font-semibold mb-2">Welcome to APEXTRACE AI</h3>
                    <p className="text-center text-muted-foreground mb-2 max-w-sm">
                      I'm your racing telemetry assistant. I can help you understand your car's data, analyze ROS2 bags, and navigate the dashboard.
                    </p>
                    <p className="text-center text-sm text-muted-foreground/70 mb-8 max-w-sm">
                      Ask me anything about telemetry, simulation, or how to use this platform!
                    </p>

                    {/* Suggested Prompts */}
                    <div className="w-full space-y-2">
                      {suggestedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(prompt.text)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashboard-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all text-left group"
                        >
                          <prompt.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          <span className="text-sm text-foreground">{prompt.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted border border-dashboard-border rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content || "..."}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-dashboard-border">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-muted rounded-full px-2 py-1 border border-dashboard-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask APEXTRACE AI..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 rounded-full bg-primary/80 hover:bg-primary shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};