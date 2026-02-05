import { useState, useMemo } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Gauge, Activity, Zap, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { useBag } from "@/contexts/BagContext";
import { useTelemetry } from "@/hooks/useTelemetry";
import ReactECharts from "echarts-for-react";

// Scoring weights (configurable)
const SCORING_WEIGHTS = {
  trackingError: 0.25,
  stabilityMargin: 0.20,
  controlSmoothness: 0.20,
  constraintViolations: 0.20,
  energyOptimality: 0.15
};

interface SectorData {
  sector: number;
  trackingScore: number;
  stabilityScore: number;
  violationsCount: number;
  energyDeviation: number;
}

interface ComponentScores {
  trackingError: number;
  stabilityMargin: number;
  controlSmoothness: number;
  constraintViolations: number;
  energyOptimality: number;
}

const LapConfidence = () => {
  const { bags, selectedBagId } = useBag();
  const { telemetry } = useTelemetry();
  const [selectedLap, setSelectedLap] = useState("1");

  const currentBag = bags.find(b => b.id === selectedBagId);

  // Generate demo laps based on mission type
  const availableLaps = useMemo(() => {
    if (!currentBag) return ["1"];
    const missionType = currentBag.missionType || "demo";
    
    if (missionType === "skidpad") {
      return ["1", "2", "3", "4", "5"];
    } else if (missionType === "autocross") {
      return ["1"];
    } else if (missionType === "endurance") {
      return Array.from({ length: 10 }, (_, i) => String(i + 1));
    }
    return ["1", "2", "3"];
  }, [currentBag]);

  // Compute component scores from telemetry (demo simulation)
  const componentScores: ComponentScores = useMemo(() => {
    const lapNum = parseInt(selectedLap);
    const seed = lapNum * 17;
    
    // Simulate realistic scoring based on telemetry if available
    let baseScores = {
      trackingError: 85 + (seed % 10),
      stabilityMargin: 80 + ((seed * 3) % 15),
      controlSmoothness: 78 + ((seed * 7) % 18),
      constraintViolations: 90 - ((seed * 2) % 20),
      energyOptimality: 82 + ((seed * 5) % 12)
    };

    // Use actual telemetry to influence scores if available
    if (telemetry && telemetry.speed.length > 0) {
      // Calculate speed variance as stability indicator
      const avgSpeed = telemetry.speed.reduce((a, b) => a + b, 0) / telemetry.speed.length;
      const speedVariance = telemetry.speed.reduce((acc, v) => acc + Math.pow(v - avgSpeed, 2), 0) / telemetry.speed.length;
      
      // High variance = lower stability
      const stabilityPenalty = Math.min(speedVariance * 2, 20);
      baseScores.stabilityMargin = Math.max(60, baseScores.stabilityMargin - stabilityPenalty);
      
      // Calculate steering smoothness from steering rate
      if (telemetry.steering.length > 1) {
        let steeringJerkSum = 0;
        for (let i = 2; i < telemetry.steering.length; i++) {
          const rate1 = telemetry.steering[i - 1] - telemetry.steering[i - 2];
          const rate2 = telemetry.steering[i] - telemetry.steering[i - 1];
          steeringJerkSum += Math.abs(rate2 - rate1);
        }
        const avgJerk = steeringJerkSum / (telemetry.steering.length - 2);
        const smoothnessPenalty = Math.min(avgJerk * 100, 25);
        baseScores.controlSmoothness = Math.max(55, baseScores.controlSmoothness - smoothnessPenalty);
      }
    }

    // Clamp all scores to 0-100
    return {
      trackingError: Math.min(100, Math.max(0, baseScores.trackingError)),
      stabilityMargin: Math.min(100, Math.max(0, baseScores.stabilityMargin)),
      controlSmoothness: Math.min(100, Math.max(0, baseScores.controlSmoothness)),
      constraintViolations: Math.min(100, Math.max(0, baseScores.constraintViolations)),
      energyOptimality: Math.min(100, Math.max(0, baseScores.energyOptimality))
    };
  }, [selectedLap, telemetry]);

  // Calculate overall confidence score
  const overallScore = useMemo(() => {
    return Math.round(
      componentScores.trackingError * SCORING_WEIGHTS.trackingError +
      componentScores.stabilityMargin * SCORING_WEIGHTS.stabilityMargin +
      componentScores.controlSmoothness * SCORING_WEIGHTS.controlSmoothness +
      componentScores.constraintViolations * SCORING_WEIGHTS.constraintViolations +
      componentScores.energyOptimality * SCORING_WEIGHTS.energyOptimality
    );
  }, [componentScores]);

  // Get status label and color
  const getStatusInfo = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-500", bgColor: "bg-green-500/10" };
    if (score >= 80) return { label: "Good", color: "text-blue-500", bgColor: "bg-blue-500/10" };
    if (score >= 70) return { label: "Marginal", color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
    return { label: "Unreliable", color: "text-red-500", bgColor: "bg-red-500/10" };
  };

  const statusInfo = getStatusInfo(overallScore);

  // Generate sector data (demo)
  const sectorData: SectorData[] = useMemo(() => {
    const numSectors = 4;
    const lapNum = parseInt(selectedLap);
    
    return Array.from({ length: numSectors }, (_, i) => {
      const sectorSeed = (lapNum * 13 + i * 7) % 100;
      return {
        sector: i + 1,
        trackingScore: 75 + (sectorSeed % 20),
        stabilityScore: 70 + ((sectorSeed * 3) % 25),
        violationsCount: (sectorSeed % 5),
        energyDeviation: parseFloat((((sectorSeed % 10) - 5) * 0.8).toFixed(1))
      };
    });
  }, [selectedLap]);

  // Find worst sector
  const worstSector = useMemo(() => {
    return sectorData.reduce((worst, sector) => {
      const avgScore = (sector.trackingScore + sector.stabilityScore) / 2 - sector.violationsCount * 5;
      const worstAvg = (worst.trackingScore + worst.stabilityScore) / 2 - worst.violationsCount * 5;
      return avgScore < worstAvg ? sector : worst;
    }, sectorData[0]);
  }, [sectorData]);

  // Generate engineer feedback
  const engineerFeedback = useMemo(() => {
    const feedback: string[] = [];
    
    if (componentScores.trackingError < 80) {
      feedback.push(`Elevated lateral tracking error in Sector ${worstSector.sector} during high-curvature zones.`);
    }
    
    if (componentScores.stabilityMargin < 80) {
      feedback.push("Minor oscillation detected post-corner exit. Damping response within acceptable limits.");
    }
    
    if (componentScores.controlSmoothness < 75) {
      feedback.push("Steering jerk spikes observed. Consider tuning controller gains for smoother response.");
    }
    
    if (componentScores.constraintViolations < 85) {
      feedback.push(`${Math.round((100 - componentScores.constraintViolations) / 5)} constraint violations logged. Review track limit adherence.`);
    }
    
    if (componentScores.energyOptimality < 85) {
      const deviation = ((100 - componentScores.energyOptimality) * 0.3).toFixed(1);
      feedback.push(`Energy usage exceeded optimal by ${deviation}%. Path corrections contributed to losses.`);
    }
    
    if (feedback.length === 0) {
      feedback.push("Lap executed within nominal parameters. All systems performing as expected.");
    }
    
    return feedback.slice(0, 3);
  }, [componentScores, worstSector]);

  // Radar chart options
  const radarChartOption = {
    backgroundColor: "transparent",
    radar: {
      indicator: [
        { name: "Tracking", max: 100 },
        { name: "Stability", max: 100 },
        { name: "Smoothness", max: 100 },
        { name: "Compliance", max: 100 },
        { name: "Efficiency", max: 100 }
      ],
      shape: "polygon",
      axisName: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 11
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(255, 255, 255, 0.02)", "rgba(255, 255, 255, 0.04)"]
        }
      },
      splitLine: {
        lineStyle: {
          color: "hsl(var(--border))"
        }
      },
      axisLine: {
        lineStyle: {
          color: "hsl(var(--border))"
        }
      }
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: [
              componentScores.trackingError,
              componentScores.stabilityMargin,
              componentScores.controlSmoothness,
              componentScores.constraintViolations,
              componentScores.energyOptimality
            ],
            name: "Lap Score",
            areaStyle: {
              color: "hsla(var(--primary), 0.3)"
            },
            lineStyle: {
              color: "hsl(var(--primary))",
              width: 2
            },
            itemStyle: {
              color: "hsl(var(--primary))"
            }
          }
        ]
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-blue-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-blue-500" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!currentBag) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <BagSidebar />
        <main className="ml-80 mt-14 p-6">
          <div className="text-center text-muted-foreground py-20">
            Select a bag to view lap confidence analysis
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Selectors */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Lap Validity & Confidence Scoring
              </h2>
              <p className="text-sm text-muted-foreground">
                Post-analysis confidence evaluation for autonomous system performance
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">Session</span>
                <Badge variant="outline" className="text-sm">
                  {currentBag.name}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">Lap</span>
                <Select value={selectedLap} onValueChange={setSelectedLap}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLaps.map(lap => (
                      <SelectItem key={lap} value={lap}>Lap {lap}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Confidence Summary Card */}
          <Card className="p-6 bg-card border-dashboard-border mb-6">
            <div className="flex items-center gap-8">
              {/* Score Display */}
              <div className="flex flex-col items-center">
                <div className={`text-6xl font-bold font-telemetry ${statusInfo.color}`}>
                  {overallScore}%
                </div>
                <Badge className={`mt-2 ${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                  {statusInfo.label}
                </Badge>
              </div>
              
              {/* Radar Chart */}
              <div className="flex-1 h-64">
                <ReactECharts option={radarChartOption} style={{ height: "100%", width: "100%" }} />
              </div>
              
              {/* Engineer Feedback */}
              <div className="flex-1 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Engineer Feedback
                </h4>
                {engineerFeedback.map((feedback, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground border-l-2 border-primary">
                    {feedback}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Scoring Breakdown */}
          <Card className="p-6 bg-card border-dashboard-border mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Score Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Tracking Error */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashboard-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Tracking</span>
                  {getScoreIcon(componentScores.trackingError)}
                </div>
                <div className={`text-2xl font-bold font-telemetry ${getScoreColor(componentScores.trackingError)}`}>
                  {componentScores.trackingError}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  RMS lateral error, peak deviations
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${componentScores.trackingError}%` }}
                  />
                </div>
              </div>

              {/* Stability Margin */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashboard-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Stability</span>
                  {getScoreIcon(componentScores.stabilityMargin)}
                </div>
                <div className={`text-2xl font-bold font-telemetry ${getScoreColor(componentScores.stabilityMargin)}`}>
                  {componentScores.stabilityMargin}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Oscillation, damping behavior
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${componentScores.stabilityMargin}%` }}
                  />
                </div>
              </div>

              {/* Control Smoothness */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashboard-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Smoothness</span>
                  {getScoreIcon(componentScores.controlSmoothness)}
                </div>
                <div className={`text-2xl font-bold font-telemetry ${getScoreColor(componentScores.controlSmoothness)}`}>
                  {componentScores.controlSmoothness}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Steering rate, jerk analysis
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${componentScores.controlSmoothness}%` }}
                  />
                </div>
              </div>

              {/* Constraint Violations */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashboard-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Compliance</span>
                  {getScoreIcon(componentScores.constraintViolations)}
                </div>
                <div className={`text-2xl font-bold font-telemetry ${getScoreColor(componentScores.constraintViolations)}`}>
                  {componentScores.constraintViolations}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Track limits, acceleration bounds
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${componentScores.constraintViolations}%` }}
                  />
                </div>
              </div>

              {/* Energy Optimality */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashboard-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Efficiency</span>
                  {getScoreIcon(componentScores.energyOptimality)}
                </div>
                <div className={`text-2xl font-bold font-telemetry ${getScoreColor(componentScores.energyOptimality)}`}>
                  {componentScores.energyOptimality}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Energy vs optimal trajectory
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${componentScores.energyOptimality}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Sector Diagnostics */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Sector-Level Diagnostics
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sector</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Tracking Score</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stability Score</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Violations</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Energy Deviation</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="font-telemetry">
                  {sectorData.map((sector) => {
                    const isWorst = sector.sector === worstSector.sector;
                    return (
                      <tr 
                        key={sector.sector} 
                        className={`border-b border-dashboard-border/50 hover:bg-muted/20 ${isWorst ? "bg-red-500/5" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-2">
                            Sector {sector.sector}
                            {isWorst && (
                              <Badge variant="destructive" className="text-xs">Worst</Badge>
                            )}
                          </span>
                        </td>
                        <td className={`text-right py-3 px-4 ${getScoreColor(sector.trackingScore)}`}>
                          {sector.trackingScore}%
                        </td>
                        <td className={`text-right py-3 px-4 ${getScoreColor(sector.stabilityScore)}`}>
                          {sector.stabilityScore}%
                        </td>
                        <td className="text-right py-3 px-4">
                          {sector.violationsCount > 0 ? (
                            <span className="text-yellow-500">{sector.violationsCount}</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={sector.energyDeviation > 0 ? "text-yellow-500" : "text-green-500"}>
                            {sector.energyDeviation > 0 ? "+" : ""}{sector.energyDeviation}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getScoreIcon((sector.trackingScore + sector.stabilityScore) / 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LapConfidence;
