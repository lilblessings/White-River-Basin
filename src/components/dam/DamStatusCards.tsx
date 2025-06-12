import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Droplet, Gauge, CloudRain, ArrowDown, ArrowUp, Zap, Waves, TrendingUp, TrendingDown, Activity, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface DamStatusCardsProps {
  currentData: any;
  damData: any;
  waterLevelStats: {
    min: number;
    max: number;
    avg: number;
  } | null;
  recentData?: any[]; // Add this for trend calculation
}

function getAlertZone(waterLevel: number, damData: any) {
  if (waterLevel >= parseFloat(damData.redLevel)) return 'red';
  if (waterLevel >= parseFloat(damData.orangeLevel)) return 'orange';
  if (waterLevel >= parseFloat(damData.blueLevel)) return 'blue';
  return 'normal';
}

// Helper function to get temperature color and status
function getTemperatureStatus(temp: number) {
  if (temp >= 80) return { color: 'red', status: 'Very Warm', bgColor: 'bg-red-500' };
  if (temp >= 75) return { color: 'orange', status: 'Warm', bgColor: 'bg-orange-500' };
  if (temp >= 68) return { color: 'green', status: 'Ideal', bgColor: 'bg-green-500' };
  if (temp >= 60) return { color: 'blue', status: 'Cool', bgColor: 'bg-blue-500' };
  if (temp >= 50) return { color: 'cyan', status: 'Cold', bgColor: 'bg-cyan-500' };
  return { color: 'slate', status: 'Very Cold', bgColor: 'bg-slate-500' };
}

// Helper function to convert storage from acre-feet to acre-feet (no conversion needed)
// The data is already in acre-feet, just format the display
function formatStorage(value: string | number): number {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  return numValue / 1000; // Convert to thousands of acre-feet for display
}

// Helper function to calculate water level change prediction
function calculateWaterLevelTrend(currentData: any, damData: any, recentData?: any[]) {
  if (!currentData) return { hourlyChange: 0, trend: 'stable', confidence: 'low' };

  const inflow = parseFloat(currentData.inflow) || 0;
  const outflow = parseFloat(currentData.totalOutflow) || 0;
  const netFlow = inflow - outflow; // CFS
  
  // Norfork Lake surface area approximation (varies by level, using average)
  // At conservation pool (~552 ft): approximately 22,000 acres
  // At flood pool (580 ft): approximately 24,000 acres
  const currentLevel = parseFloat(currentData.waterLevel) || 552;
  const surfaceAreaAcres = 22000 + ((currentLevel - 552) / (580 - 552)) * 2000;
  
  // Convert CFS to hourly change in feet
  // 1 CFS = 1 cubic foot per second
  // 1 hour = 3600 seconds
  // 1 acre = 43,560 square feet
  const cubicFeetPerHour = netFlow * 3600;
  const surfaceAreaSqFt = surfaceAreaAcres * 43560;
  const hourlyChangeFeet = cubicFeetPerHour / surfaceAreaSqFt;
  
  // Calculate trend based on recent data if available
  let trend = 'stable';
  let confidence = 'medium';
  
  if (Math.abs(hourlyChangeFeet) > 0.01) {
    trend = hourlyChangeFeet > 0 ? 'rising' : 'falling';
    confidence = 'high';
  } else if (Math.abs(hourlyChangeFeet) > 0.005) {
    trend = hourlyChangeFeet > 0 ? 'rising' : 'falling';
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // If we have recent data, improve the prediction
  if (recentData && recentData.length >= 3) {
    const recent3Hours = recentData.slice(0, 3).map(d => parseFloat(d.waterLevel));
    const levelTrend = recent3Hours[0] - recent3Hours[2]; // Latest - 3 hours ago
    
    if (Math.abs(levelTrend) > 0.05) {
      trend = levelTrend > 0 ? 'rising' : 'falling';
      confidence = 'high';
    }
  }

  return {
    hourlyChange: hourlyChangeFeet,
    hourlyChangeInches: hourlyChangeFeet * 12, // Convert to inches
    trend,
    confidence,
    netFlow
  };
}

export function DamStatusCards({ currentData, damData, waterLevelStats, recentData }: DamStatusCardsProps) {
  const currentAlertZone = currentData ? getAlertZone(parseFloat(currentData.waterLevel), damData) : 'normal';
  const levelTrend = calculateWaterLevelTrend(currentData, damData, recentData);

  return (
    <motion.div 
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
          }
        }
      }}
    >
      {/* Water Level Card */}
<motion.div variants={{
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}}>
  <Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-blue-500 transition-all duration-300 hover:shadow-lg h-[180px] flex flex-col">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
        <Droplet className="h-4 w-4 text-blue-500" />
        Water Level
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-1">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl md:text-2xl font-bold tracking-tight">
            <AnimatedNumber 
              value={currentData?.waterLevel ? parseFloat(currentData.waterLevel) : 0} 
              decimals={2}
              suffix=" ft"
            />
          </span>
          {currentData && (
            <div className={cn(
              "w-5 h-5 rounded-full transition-colors shadow-sm",
              currentAlertZone === 'red' && "bg-red-500",
              currentAlertZone === 'orange' && "bg-orange-500", 
              currentAlertZone === 'blue' && "bg-blue-500",
              currentAlertZone === 'normal' && "bg-green-500"
            )} />
          )}
        </div>
        {waterLevelStats && (
          <div className="mt-auto">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="flex flex-col items-center p-1.5 rounded-md bg-background/50 dark:bg-black/30">
                  <span className="text-xs md:text-sm text-muted-foreground">Min</span>
                  <span className="text-xs md:text-sm font-medium">
                    <AnimatedNumber value={waterLevelStats.min} decimals={1} suffix=" Ft" />
                  </span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-md bg-background/50 dark:bg-black/30">
                  <span className="text-xs md:text-sm text-muted-foreground">Avg</span>
                  <span className="text-xs md:text-sm font-medium">
                    <AnimatedNumber value={waterLevelStats.avg} decimals={1} suffix=" Ft" />
                  </span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-md bg-background/50 dark:bg-black/30">
                  <span className="text-xs md:text-sm text-muted-foreground">Max</span>
                  <span className="text-xs md:text-sm font-medium">
                    <AnimatedNumber value={waterLevelStats.max} decimals={1} suffix=" Ft" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</motion.div>

      {/* Storage Card */}
      <motion.div variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}>
        <        Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-emerald-500 transition-all duration-300 hover:shadow-lg h-[180px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-500" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight flex items-baseline">
                  <AnimatedNumber 
                    value={currentData?.storagePercentage ? parseFloat(currentData.storagePercentage) : 0}
                    decimals={1}
                    suffix="%"
                  />
                </span>
                <div className="text-xs md:text-sm text-muted-foreground">
                  <AnimatedNumber 
                    value={formatStorage(currentData?.liveStorage || "0")}
                    decimals={0}
                    suffix=" K AF"
                  />
                </div>
              </div>
              <Progress 
                value={(parseFloat(currentData?.liveStorage?.replace(/,/g, '') || "0") / parseFloat(damData.liveStorageAtFRL?.replace(/,/g, '') || "1")) * 100} 
                className="h-2" 
              />
              <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mt-2">
                <span>Total Capacity</span>
                <span className="font-medium">
                  <AnimatedNumber value={formatStorage(damData.liveStorageAtFRL)} decimals={0} suffix=" K AF" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Water Temperature Card */}
      <motion.div variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}>
        <        Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-cyan-500 transition-all duration-300 hover:shadow-lg h-[180px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-cyan-500" />
              Lake Temperature
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight">
                  {currentData?.lakeWaterTemp ? (
                    <AnimatedNumber 
                      value={parseInt(currentData.lakeWaterTemp.replace('°F', '') || '0')}
                      decimals={0}
                      suffix="°F"
                    />
                  ) : (
                    <span className="text-muted-foreground">--°F</span>
                  )}
                </span>
                {currentData?.lakeWaterTemp && (
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium transition-colors shadow-sm text-white",
                    (() => {
                      const temp = parseInt(currentData.lakeWaterTemp.replace('°F', '') || '0');
                      const status = getTemperatureStatus(temp);
                      return status.bgColor;
                    })()
                  )}>
                    {(() => {
                      const temp = parseInt(currentData.lakeWaterTemp.replace('°F', '') || '0');
                      return getTemperatureStatus(temp).status;
                    })()}
                  </div>
                )}
              </div>
              
              {/* Temperature Gauge */}
              {currentData?.lakeWaterTemp && (
                <div className="mb-2">
                  <Progress 
                    value={Math.min(100, Math.max(0, (parseInt(currentData.lakeWaterTemp.replace('°F', '') || '0') - 32) / (90 - 32) * 100))}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>32°F</span>
                    <span>90°F</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mt-auto pt-2 border-t">
                <span>Source</span>
                <span className="font-medium text-right text-xs">
                  {currentData?.lakeWaterTempSource ? 
                    (currentData.lakeWaterTempSource.includes('SeaTemperature') ? 'Estimated' : 'Measured') : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Water Level Trend Prediction Card */}
      <motion.div variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}>
        <        Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-indigo-500 transition-all duration-300 hover:shadow-lg h-[160px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              Level Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
  <span className="text-xl md:text-2xl font-bold tracking-tight">
                    {levelTrend.hourlyChange >= 0 ? '+' : ''}
                    <AnimatedNumber 
                      value={levelTrend.hourlyChangeInches}
                      decimals={2}
                      suffix=" in/hr"
                    />
                  </span>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full text-xs font-medium transition-colors shadow-sm",
                  levelTrend.confidence === 'high' && "bg-green-500",
                  levelTrend.confidence === 'medium' && "bg-orange-500",
                  levelTrend.confidence === 'low' && "bg-gray-500"
                )}>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t text-xs md:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Net Flow</span>
                  <span className={cn(
                    "font-medium",
                    levelTrend.netFlow > 0 && "text-green-600 dark:text-green-400",
                    levelTrend.netFlow < 0 && "text-red-600 dark:text-red-400"
                  )}>
                    {levelTrend.netFlow >= 0 ? '+' : ''}
                    <AnimatedNumber value={levelTrend.netFlow} decimals={0} suffix=" CFS" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground"></span>
                  
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:contents">
        {/* Inflow Card */}
        <motion.div variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}>
          <Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-blue-500 transition-all duration-300 hover:shadow-lg h-[160px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-blue-500" />
                Inflow
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl md:text-2xl font-bold tracking-tight">
                    <AnimatedNumber 
                      value={currentData?.inflow ? parseFloat(currentData.inflow) : 0}
                      decimals={0}
                      suffix=" CFS"
                    />
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mt-auto pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <CloudRain className="h-3.5 w-3.5 text-sky-500" />
                    <span>Rainfall</span>
                  </div>
                  <span className="font-medium">
                    <AnimatedNumber value={currentData?.rainfall ? parseFloat(currentData.rainfall) : 0} decimals={2} suffix=" in" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Outflow Card */}
        <motion.div variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}>
          <Card className="bg-white/50 dark:bg-black/40 backdrop-blur-sm border-l-4 border-l-purple-500 transition-all duration-300 hover:shadow-lg h-[160px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-purple-500" />
                Outflow
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl md:text-2xl font-bold tracking-tight">
                    <AnimatedNumber 
                      value={currentData?.totalOutflow ? parseFloat(currentData.totalOutflow) : 0}
                      decimals={0}
                      suffix=" CFS"
                    />
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Power</span>
                    </div>
                    <span className="font-medium">
                      <AnimatedNumber value={currentData?.powerHouseDischarge ? parseFloat(currentData.powerHouseDischarge) : 0} decimals={0} suffix=" CFS" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Waves className="h-3.5 w-3.5 text-red-500" />
                      <span>Spillway</span>
                    </div>
                    <span className="font-medium">
                      <AnimatedNumber value={currentData?.spillwayRelease ? parseFloat(currentData.spillwayRelease) : 0} decimals={0} suffix=" CFS" />
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}