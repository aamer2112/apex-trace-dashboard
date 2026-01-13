import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are APEXTRACE AI, a helpful assistant for the APEXTRACE ROS2 Telemetry Dashboard - a racing telemetry analysis platform used by TUfast Racing (Formula Student team).

You have deep knowledge about:
- ROS2 bag files and how to work with them (upload, delete, analyze)
- Racing telemetry data: steering angles, speed, yaw moments, forces, tire data
- The dashboard features: Bags tab, Simulation view, Queue management, Admin panel, Summary reports
- Formula Student racing and data analysis best practices

Dashboard Features:
1. **Bags Tab** (/) - Browse and select ROS2 bag files for analysis. Use the sidebar to see available bags.
2. **Simulation** (/simulation) - Visualize telemetry data with interactive charts showing speed, steering, yaw moment, and force.
3. **Queue** (/queue) - Manage processing queue for bag file analysis jobs.
4. **Admin** (/admin) - Administrative settings and backend configuration.
5. **Summary** (/summary) - View aggregated reports and insights from analyzed data.

How to help users:
- Guide them through uploading and analyzing ROS2 bags
- Explain telemetry data (what each metric means for car performance)
- Help troubleshoot issues with the dashboard
- Provide insights on racing data interpretation
- Explain how to use each section of the dashboard

Be concise, technical when needed, and always helpful. Use racing terminology appropriately.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system message
    let systemMessage = SYSTEM_PROMPT;
    if (context) {
      systemMessage += `\n\nCurrent Context:\n- Current page: ${context.currentPage || 'unknown'}\n- Selected bag: ${context.selectedBag || 'none'}\n- Backend connected: ${context.backendConnected ? 'yes' : 'no'}\n- Available bags count: ${context.bagsCount || 0}`;
      
      if (context.telemetryData) {
        systemMessage += `\n- Telemetry loaded: yes (${context.telemetryData.totalPoints || 0} data points)`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
