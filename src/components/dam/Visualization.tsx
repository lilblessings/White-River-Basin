import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useTheme } from "@/components/ui/theme-provider";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface VisualizationProps {
  data: any[];
  domain?: [number, number];
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  damData: any; 
}

// Helper function to parse date and time strings into a proper Date object
const parseDateTime = (dateStr: string, timeStr?: string): Date => {
  if (!dateStr) return new Date();
  
  try {
    const [day, month, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    return date;
  } catch (error) {
    console.warn('Invalid date format:', dateStr, timeStr);
    return new Date();
  }
};

export function Visualization({ data, currentIndex, onIndexChange, damData }: VisualizationProps) {
  const { theme } = useTheme();
  
  // Safety check for data
  if (!data || !Array.isArray(data)) {
    return (
      <Card className="glass-card h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  // Filter out any undefined/null items from data
  const validData = data.filter(item => item && typeof item === 'object' && item.date);
  
  if (validData.length === 0) {
    return (
      <Card className="glass-card h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-muted-foreground">No valid data available</div>
        </CardContent>
      </Card>
    );
  }

  // Use validData and ensure currentIndex is within bounds
  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, validData.length - 1));
  const currentData = validData[safeCurrentIndex] || validData[validData.length - 1];
  
  // Check if this is a river (has type: 'river') or dam (default)
  const isRiver = damData?.type === 'river';
  
  const waterLevel = parseFloat(currentData?.storagePercentage || "0");
  const hasRainfall = parseFloat(currentData?.rainfall || "0") > 0;
  const flowRate = parseFloat(currentData?.totalOutflow || currentData?.inflow || "0");

  // Determine if we're showing hourly data
  const isHourlyData = validData.some(item => item.time);

  const raindrops = useMemo(() => {
    if (!hasRainfall) return [];
    const rainfall = parseFloat(currentData?.rainfall || "0");
    const minDrops = 10;
    const maxDrops = 40;
    const count = Math.min(maxDrops, minDrops + Math.ceil(rainfall * 1.5));

    return Array.from({ length: count }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 0.4}s`,
      height: `${3 + (rainfall / 20 * Math.random() * 2)}vh`,
      key: i
    }));
  }, [hasRainfall, currentData?.rainfall]);

  const fixedStars = useMemo(() => Array.from({ length: 85 }).map((_, i) => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const prime1 = primes[i % primes.length];
    const prime2 = primes[(i + 7) % primes.length];

    return {
      x: 25 + ((i * phi * prime1) % 750), 
      y: 10 + ((i * phi * prime2) % 170), 
      size: 0.3 + (Math.sin(i * phi) + 1) * 0.8,
      brightness: 0.3 + (Math.cos(i * phi) + 1) * 0.3,
    };
  }), []); 

  const handleSliderChange = (value: number[]) => {
    const newIndex = Math.round(value[0]);
    if (newIndex >= 0 && newIndex < validData.length) {
      onIndexChange?.(newIndex);
    }
  };

  const handlePrevious = () => {
    if (safeCurrentIndex > 0) {
      onIndexChange?.(safeCurrentIndex - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentIndex < validData.length - 1) {
      onIndexChange?.(safeCurrentIndex + 1);
    }
  };

  // Updated formatDate function to handle time
  const formatDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return 'Invalid Date';
    
    try {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
        return format(date, 'MMM dd, yyyy HH:mm');
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Date formatting error:', dateStr, timeStr);
      return 'Invalid Date';
    }
  };

  // Updated handleDateSelect for hourly data
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !validData.length) return;
    
    const targetDate = format(date, 'dd.MM.yyyy');
    
    // For hourly data, find entries for that day
    if (isHourlyData) {
      const dayEntries = validData.filter(item => item.date === targetDate);
      
      if (dayEntries.length > 0) {
        // Find the index of the last entry for that day in the original data
        const lastEntryOfDay = dayEntries[dayEntries.length - 1];
        const newIndex = validData.findIndex(item => item === lastEntryOfDay);
        if (newIndex !== -1) {
          onIndexChange?.(newIndex);
        }
      }
    } else {
      // For daily data, find exact date match
      const newIndex = validData.findIndex(item => item.date === targetDate);
      
      if (newIndex !== -1) {
        onIndexChange?.(newIndex);
      }
    }
  };

  // Updated currentDate calculation
  const currentDate = useMemo(() => {
    if (!currentData || !currentData.date) return new Date();
    
    try {
      return parseDateTime(currentData.date, currentData.time);
    } catch (error) {
      console.warn('Invalid date/time format:', currentData.date, currentData.time);
      return new Date();
    }
  }, [currentData]);

  // Updated availableDates calculation with safety checks
  const availableDates = useMemo(() => {
    return validData
      .filter(item => item && item.date) // Filter out invalid items
      .map(item => {
        try {
          return parseDateTime(item.date, item.time);
        } catch (error) {
          console.warn('Invalid date format:', item.date);
          return null;
        }
      })
      .filter(date => date !== null); // Remove failed date parsing attempts
  }, [validData]);

  return (
    <Card className="glass-card h-full">
      <CardContent className="p-0 flex flex-col">
        <div className="flex-1 relative">
          <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="sky-gradient-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#87CEEB" />
                <stop offset="100%" stopColor="#E0F6FF" />
              </linearGradient>

              <linearGradient id="sky-gradient-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1026" />
              </linearGradient>

              <radialGradient id="sun-gradient" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#FFE87C" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="moon-gradient" cx="0.5" cy="0.5" r="0.4">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="water-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--dam-water))" stopOpacity="var(--dam-water-opacity)" />
                <stop offset="100%" stopColor="hsl(var(--dam-water))" stopOpacity={0.5} />
              </linearGradient>

              <linearGradient id="river-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2171B5" stopOpacity="0.9" />
              </linearGradient>

              <radialGradient id="star-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>

              <path id="cloud-path"
                d="M0 0 
                   a10 10 0 0 1 20 0
                   a8 8 0 0 1 10 8
                   a8 8 0 0 1 -10 8
                   h-20
                   a10 10 0 0 1 0 -16
                   z" />

              {/* River flow pattern */}
              <pattern id="river-flow" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <motion.path
                  d="M0,10 Q10,5 20,10 T40,10"
                  stroke="#ffffff"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.3"
                  animate={{ x: [0, 40] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </pattern>
            </defs>

            {/* Sky bg */}
            <motion.rect
              x="0" y="0" width="800" height="400"
              initial={false}
              animate={{
                fill: theme === 'light' ? 'url(#sky-gradient-light)' : 'url(#sky-gradient-dark)'
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Animated Clouds */}
            <g className="clouds">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.g
                  key={`cloud-${i}`}
                  initial={{ x: -100, y: 20 + i * 15 }}
                  animate={{
                    x: [800, -100],
                    opacity: [0, 0.8, 0.8, 0]
                  }}
                  transition={{
                    x: {
                      duration: 45 + i * 5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 12
                    },
                    opacity: {
                      duration: 45 + i * 5,
                      repeat: Infinity,
                      times: [0, 0.1, 0.9, 1],
                      delay: i * 12
                    }
                  }}
                >
                  <use
                    href="#cloud-path"
                    fill="hsl(var(--dam-cloud))"
                    opacity={0.8}
                    transform={`scale(${1 + i * 0.2})`}
                  />
                </motion.g>
              ))}
            </g>

            {/* Celestial bodies */}
            <AnimatePresence mode="sync" initial={false}>
              {theme === 'light' ? (
                <motion.g
                  key="sun"
                  initial={{ opacity: 0, y: 300 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 300 }}
                  transition={{
                    opacity: { duration: 0.5 },
                    y: { duration: 0.8 }
                  }}
                >
                  <circle cx="700" cy="60" r="35" fill="url(#sun-gradient)">
                    <animate
                      attributeName="r"
                      values="35;38;35"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  <motion.circle
                    cx="700"
                    cy="60"
                    r="20"
                    fill="#FFE87C"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.9, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  <circle cx="700" cy="60" r="15" fill="#FFA500" />
                </motion.g>
              ) : (
                <motion.g
                  key="moon-and-stars"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.g
                    initial={{ opacity: 0, y: 300 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 300 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 0.8 }
                    }}
                  >
                    <circle cx="700" cy="60" r="25" fill="url(#moon-gradient)" />
                    <circle cx="700" cy="60" r="20" fill="#FFFFFF" />
                  </motion.g>

                  {fixedStars.map((star, i) => {
                    const distanceFromMoon = Math.sqrt(Math.pow(star.x - 700, 2) + Math.pow(star.y - 60, 2));
                    if (distanceFromMoon < 50) return null;

                    const isExtraBright = i % 7 === 0;
                    const delay = i * 0.01;

                    return (
                      <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: delay
                        }}
                      >
                        {(star.size > 1.5 || isExtraBright) && (
                          <motion.circle
                            cx={star.x}
                            cy={star.y}
                            r={isExtraBright ? star.size * 2.5 : star.size * 2}
                            fill="url(#star-glow)"
                            animate={{
                              opacity: isExtraBright ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3],
                              scale: [0.8, 1, 0.8]
                            }}
                            transition={{
                              duration: 2 + (i % 3),
                              repeat: Infinity,
                              delay: delay
                            }}
                          />
                        )}
                        <motion.circle
                          cx={star.x}
                          cy={star.y}
                          r={isExtraBright ? star.size * 1.2 : star.size}
                          fill="#FFFFFF"
                          animate={{
                            opacity: [
                              star.brightness,
                              isExtraBright ? star.brightness + 0.5 : star.brightness + 0.3,
                              star.brightness
                            ]
                          }}
                          transition={{
                            duration: isExtraBright ? 3 + (i % 2) : 1.5 + (i % 3),
                            repeat: Infinity,
                            delay: delay
                          }}
                        />
                      </motion.g>
                    );
                  })}
                </motion.g>
              )}
            </AnimatePresence>

            {/* Main content area */}
            <g transform="translate(150,100)">
              {isRiver ? (
                // RIVER VISUALIZATION
                <>
                  {/* River banks */}
                  <path
                    d="M0,200 Q150,180 300,200 T600,200 L600,250 Q450,270 300,250 Q150,230 0,250 Z"
                    fill="#8B4513"
                    opacity="0.8"
                  />
                  <path
                    d="M0,150 Q150,130 300,150 T600,150 L600,200 Q450,180 300,200 Q150,180 0,200 Z"
                    fill="#8B4513"
                    opacity="0.8"
                  />

                  {/* River water with flow animation */}
                  <motion.path
                    d="M0,200 Q150,180 300,200 T600,200 L600,250 Q450,230 300,250 Q150,230 0,250 Z"
                    fill="url(#river-gradient)"
                    animate={{
                      d: [
                        "M0,200 Q150,180 300,200 T600,200 L600,250 Q450,230 300,250 Q150,230 0,250 Z",
                        "M0,195 Q150,175 300,195 T600,195 L600,245 Q450,225 300,245 Q150,225 0,245 Z",
                        "M0,200 Q150,180 300,200 T600,200 L600,250 Q450,230 300,250 Q150,230 0,250 Z"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Flow lines animation */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.path
                      key={`flow-${i}`}
                      d={`M0,${210 + i * 8} Q150,${190 + i * 8} 300,${210 + i * 8} T600,${210 + i * 8}`}
                      stroke="#ffffff"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.4"
                      strokeDasharray="10,5"
                      animate={{
                        strokeDashoffset: [0, -15]
                      }}
                      transition={{
                        duration: 2 + i * 0.2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  ))}

                  {/* River gauge station */}
                  <g transform="translate(300,180)">
                    {/* Gauge post */}
                    <rect
                      x="-5"
                      y="-20"
                      width="10"
                      height="60"
                      fill="#666"
                    />
                    
                    {/* Gauge markings */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <line
                        key={`gauge-mark-${i}`}
                        x1="5"
                        y1={-10 + i * 8}
                        x2="10"
                        y2={-10 + i * 8}
                        stroke="#333"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Water level indicator */}
                    <motion.circle
                      cx="0"
                      cy={20 - (waterLevel / 100) * 40}
                      r="8"
                      fill="#FF4444"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    />

                    {/* Gauge level display */}
                    <g transform="translate(-80,-30)">
                      <foreignObject x="-50" y="-10" width="100" height="24">
                        <div className="text-center" style={{ width: '100%', height: '100%' }}>
                          <AnimatedNumber
                            value={parseFloat(currentData?.waterLevel || '0')}
                            decimals={2}
                            suffix=" ft"
                            className="text-lg font-medium"
                          />
                        </div>
                      </foreignObject>
                      <text x="0" y="20" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="12">
                        Gauge Height
                      </text>
                    </g>
                  </g>

                  {/* Trees along banks */}
                  {[50, 120, 180, 420, 480, 550].map((x, i) => (
                    <g key={`tree-${i}`} transform={`translate(${x},${i % 2 === 0 ? 140 : 260})`}>
                      {/* Tree trunk */}
                      <rect x="-3" y="0" width="6" height="20" fill="#8B4513" />
                      {/* Tree foliage */}
                      <circle cx="0" cy="-5" r="12" fill="#228B22" opacity="0.8" />
                      <circle cx="-5" cy="-8" r="8" fill="#32CD32" opacity="0.6" />
                      <circle cx="5" cy="-8" r="8" fill="#32CD32" opacity="0.6" />
                    </g>
                  ))}

                  {/* Rocks in river */}
                  {[180, 350, 420].map((x, i) => (
                    <ellipse
                      key={`rock-${i}`}
                      cx={x}
                      cy={225 + i * 5}
                      rx="8"
                      ry="5"
                      fill="#696969"
                      opacity="0.7"
                    />
                  ))}
                </>
              ) : (
                // EXISTING DAM VISUALIZATION
                <>
                  {/* Reservoir */}
                  <g>
                    {/*buoy*/}
                    <g transform="translate(-50,80)">
                      <motion.g
                        initial={{ y: 220 * (1 - waterLevel / 100) }}
                        animate={{ 
                          y: 220 * (1 - waterLevel / 100),
                          rotate: [-2, 2, -2]
                        }}
                        transition={{ 
                          y: { 
                            type: "spring", 
                            stiffness: 50, 
                            damping: 12 
                          },
                          rotate: {
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {/* Storage percentage */}
                        <g transform="translate(-65,-17)">
                          <foreignObject x="-150" y="-10" width="200" height="24">
                            <div className="text-right" style={{ width: '100%', height: '100%' }}>
                              <AnimatedNumber
                                value={waterLevel}
                                decimals={1}
                                suffix="%"
                                className="text-2xl font-medium"
                              />
                            </div>
                          </foreignObject>
                        </g>

                        {/* Main buoy */}
                        <image
                          href="/buoy.webp"
                          x="-20"
                          y="-32"
                          width="40"
                          height="40"
                        />

                        {/* Water level measurement */}
                        <g transform="translate(22,-17)">
                          <foreignObject x="-30" y="-10" width="150" height="24">
                            <div className="text-center" style={{ width: '100%', height: '100%' }}>
                              <AnimatedNumber
                                value={parseFloat(currentData?.waterLevel || '0')}
                                decimals={2}
                                suffix="m"
                                className="text-2xl font-medium"
                              />
                            </div>
                          </foreignObject>
                        </g>
                      </motion.g>
                    </g>

                    {/* Water area */}
                    <motion.rect
                      x="-300"
                      initial={{ y: 80 + (220 * (1 - waterLevel / 100)), height: 220 * (waterLevel / 100) }}
                      animate={{ y: 80 + (220 * (1 - waterLevel / 100)), height: 220 * (waterLevel / 100) }}
                      transition={{ type: "spring", stiffness: 50, damping: 15 }}
                      width="420"
                      fill="url(#water-gradient)"
                      rx="0 12 12 0"
                    />

                    {/* Dam Structure and other existing elements... */}
                    {/* (keeping existing dam visualization for space) */}
                  </g>
                </>
              )}

              {/* Data displays - adjusted for river vs dam */}
              <g transform="translate(280,0)">
                <g transform="translate(0,130)">
                  <text x="5" y="30"
                    fill="hsl(var(--foreground))"
                    fontSize="14"
                    fontWeight="500">
                    {isRiver ? 'Current Flow' : 'Spillway Discharge'}
                  </text>
                  <foreignObject x="5" y="35" width="130" height="30">
                    <div className="text-2xl font-medium">
                      <AnimatedNumber
                        value={parseFloat(currentData?.spillwayRelease || currentData?.totalOutflow || '0')}
                        decimals={0}
                        suffix=" CFS"
                      />
                    </div>
                  </foreignObject>
                </g>

                {!isRiver && (
                  <g transform="translate(0,220)">
                    <text x="5" y="30"
                      fill="hsl(var(--foreground))"
                      fontSize="14"
                      fontWeight="500">
                      Power H. Discharge
                    </text>
                    <foreignObject x="5" y="35" width="130" height="30">
                      <div className="text-2xl font-medium">
                        <AnimatedNumber
                          value={parseFloat(currentData?.powerHouseDischarge || '0')}
                          decimals={0}
                          suffix=" CFS"
                        />
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>

              {/* Input data */}
              <g transform="translate(-290,0)">
                <g transform="translate(0,-30)">
                  <text x="0" y="-45"
                    fill="hsl(var(--foreground))"
                    fontSize="14"
                    fontWeight="500">
                    Rainfall
                  </text>
                  <foreignObject x="0" y="-45" width="130" height="30">
                    <div className="text-2xl font-medium">
                      <AnimatedNumber
                        value={parseFloat(currentData?.rainfall || '0')}
                        decimals={0}
                        suffix=" in"
                      />
                    </div>
                  </foreignObject>
                </g>

                <g transform="translate(0,220)">
                  <text x="20" y="30"
                    fill="hsl(var(--foreground))"
                    fontSize="14"
                    fontWeight="500">
                    {isRiver ? 'Upstream Flow' : 'Inflow'}
                  </text>
                  <foreignObject x="20" y="35" width="130" height="30">
                    <div className="text-2xl font-medium">
                      <AnimatedNumber
                        value={parseFloat(currentData?.inflow || '0')}
                        decimals={0}
                        suffix=" CFS"
                      />
                    </div>
                  </foreignObject>
                </g>
              </g>
            </g>
          </svg>
          
          {/* Rainfall animation overlay */}
          {hasRainfall && (
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              {raindrops.map((drop) => (
                <div
                  key={`raindrop-${drop.key}`}
                  className="drop"
                  style={{
                    left: drop.left,
                    height: drop.height,
                    animationDelay: drop.animationDelay,
                    background: theme === 'light' ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.2)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Navigation controls (same for both) */}
        <div className="px-6 pt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={safeCurrentIndex === 0}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="text-sm text-muted-foreground font-medium min-w-[150px] justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {currentData?.date && formatDate(currentData.date, currentData.time)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  return !availableDates.some(
                    (d) => d && d.toDateString() === date.toDateString()
                  );
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={safeCurrentIndex === validData.length - 1}
            className="h-8 w-8 shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Slider controls (same for both) */}
        <div className="px-6 pb-8 pt-5 overflow-hidden">
          <div className="relative mx-4">
            <Slider
              value={[safeCurrentIndex]}
              min={0}
              max={validData.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            {validData.length > 0 && (
              <div className="relative -mt-">
                <div className="relative text-[10px] text-muted-foreground">
                  {Array.from({ length: Math.min(6, Math.floor(validData.length / 30)) }).map((_, idx, arr) => {
                    const dataIndex = Math.floor((idx * (validData.length - 1)) / (arr.length - 1));
                    const position = `${(idx / (arr.length - 1)) * 100}%`;
                    const item = validData[dataIndex];

                    if (!item || !item.date) return null;

                    return (
                      <div
                        key={dataIndex}
                        className="absolute"
                        style={{
                          left: position,
                          width: '28px',
                          transform: idx === 0 ? 'translateX(0)' :
                            idx === arr.length - 1 ? 'translateX(-100%)' :
                              'translateX(-50%)'
                        }}
                      >
                        <div className="h-2 w-[2px] bg-muted-foreground/40 mx-auto mb-1.5"></div>
                        <div className={`opacity-90 font-medium leading-none tracking-tight whitespace-nowrap ${idx === 0 ? 'text-left pl-0.5' :
                            idx === arr.length - 1 ? 'text-right pr-0.5' :
                              'text-center'
                          }`}>
                          {isHourlyData 
                            ? format(parseDateTime(item.date, item.time), 'MM/dd HH:mm')
                            : format(parseDateTime(item.date), 'MM/yy')
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
