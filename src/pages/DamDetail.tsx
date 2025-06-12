import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchHistoricalDamData } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Building2, CloudRain, ArrowDown, ArrowUp } from "lucide-react";
import { DateRange } from "react-day-picker";
import { parse, parseISO, isWithinInterval, format, startOfDay, addMonths, subYears, addHours, startOfHour } from "date-fns";
import { DamHeader } from "@/components/dam/DamHeader";
import { DamStatusCards } from "@/components/dam/DamStatusCards";
import { DamSpecifications } from "@/components/dam/DamSpecifications";
import { TrendChart } from "@/components/dam/TrendChart";
import { Visualization } from "@/components/dam/Visualization";
import { Helmet } from 'react-helmet';

const TIME_RANGE_STORAGE_KEY = 'dam-time-range';

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

const parseNumber = (value: string | undefined): number => {
  if (!value || value.trim() === '') return 0;
  // Remove commas and % symbols for better parsing
  const cleaned = value.replace(/,/g, '').replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const calculateAxisDomain = (data: number[]): [number, number] => {
  const validData = data.filter(val => typeof val === 'number' && !isNaN(val) && val !== undefined);
  if (validData.length === 0) return [0, 100];
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  if (min === max) {
    const value = min;
    return [value * 0.9, value * 1.1];
  }
  const padding = (max - min) * 0.05;
  return [min - padding, max + padding];
};

const DamDetail = () => {
  const { name } = useParams();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    try {
      const savedRange = localStorage.getItem(TIME_RANGE_STORAGE_KEY);
      if (savedRange) {
        const parsed = JSON.parse(savedRange);
        const from = new Date(parsed.from);
        const to = new Date(parsed.to);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          return { from: startOfDay(from), to: startOfDay(to) };
        }
      }
    } catch (e) {
      localStorage.removeItem(TIME_RANGE_STORAGE_KEY);
    }
    return undefined;
  });
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [isChangingRange, setIsChangingRange] = useState(false);
  const [visualizationIndex, setVisualizationIndex] = useState(0);

  const { data: damData, isLoading, error } = useQuery({
    queryKey: ["dam-history", name],
    queryFn: () => fetchHistoricalDamData(name || ""),
    enabled: !!name,
  });

  // Update reference date calculation to handle time
  useEffect(() => {
    if (damData?.data && damData.data.length > 0) {
      const mostRecentDate = damData.data.reduce((latest, item) => {
        if (!item || !item.date) return latest;
        const itemDate = parseDateTime(item.date, item.time);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0));

      setReferenceDate(mostRecentDate);
      const defaultRange = {
        from: startOfDay(addMonths(mostRecentDate, -6)),
        to: startOfDay(mostRecentDate)
      };
      setDateRange(defaultRange);
    }
  }, [damData?.data]);

  // Updated filtered data to handle hourly timestamps
  const filteredData = useMemo(() => {
    if (!damData?.data || !dateRange?.from) return damData?.data || [];

    const filtered = damData.data.filter((item) => {
      if (!item || !item.date) return false;
      
      const itemDate = parseDateTime(item.date, item.time);
      const startDate = dateRange.from;
      const endDate = dateRange.to || referenceDate;
      
      return isWithinInterval(itemDate, { 
        start: startDate, 
        end: endDate
      });
    });

    return filtered.sort((a, b) => {
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      return dateA.getTime() - dateB.getTime();
    });
  }, [damData?.data, dateRange, referenceDate]);

  // Updated visualization data to handle time
  const visualizationData = useMemo(() => {
    if (!damData?.data || !referenceDate) return [];
    const twoYearsAgo = subYears(referenceDate, 2);

    const filtered = damData.data.filter((item) => {
      if (!item || !item.date) return false;
      
      const itemDate = parseDateTime(item.date, item.time);
      return itemDate >= twoYearsAgo && itemDate <= referenceDate;
    });

    return filtered.sort((a, b) => {
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      return dateA.getTime() - dateB.getTime();
    });
  }, [damData?.data, referenceDate]);

  // Determine if we're showing hourly data
  const isHourlyTimeRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return false;
    
    const diffHours = (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60);
    return diffHours <= 72; // 3 days or less = hourly view
  }, [dateRange]);

  const waterLevelStats = useMemo(() => {
    if (!filteredData?.length) return null;
    const levels = filteredData
      .filter(d => d && d.waterLevel)
      .map(d => parseFloat(d.waterLevel))
      .filter(level => !isNaN(level));
    if (levels.length === 0) return null;
    return {
      min: Math.min(...levels),
      max: Math.max(...levels),
      avg: levels.reduce((a, b) => a + b, 0) / levels.length
    };
  }, [filteredData]);

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setIsChangingRange(true);
    setDateRange(newRange);

    try {
      if (newRange?.from && newRange?.to) {
        localStorage.setItem(TIME_RANGE_STORAGE_KEY, JSON.stringify({
          from: startOfDay(newRange.from).toISOString(),
          to: startOfDay(newRange.to).toISOString()
        }));
      } else {
        localStorage.removeItem(TIME_RANGE_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save time range to localStorage:', e);
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsChangingRange(false);
      }, 300);
    });
  };

  const isTimeRangeLoading = useMemo(() => {
    return isLoading || isChangingRange || (dateRange && !filteredData);
  }, [isLoading, isChangingRange, dateRange, filteredData]);

  useEffect(() => {
    if (visualizationData?.length) {
      setVisualizationIndex(visualizationData.length - 1);
    }
  }, [visualizationData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading dam data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading dam data</div>
      </div>
    );
  }

  if (!damData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Dam not found</div>
      </div>
    );
  }

  // Safely get current data
  const currentData = filteredData && filteredData.length > 0 
    ? filteredData[filteredData.length - 1] 
    : (damData?.data && damData.data.length > 0 ? damData.data[damData.data.length - 1] : null);

  // Calculate domains for charts with safety checks
  const inflowDomain = calculateAxisDomain(
    filteredData?.filter(d => d && d.inflow).map(d => parseNumber(d.inflow)) || []
  );
  const rainfallDomain = calculateAxisDomain(
    filteredData?.filter(d => d && d.rainfall).map(d => parseNumber(d.rainfall)) || []
  );
  const storageDomain = calculateAxisDomain(
    filteredData?.filter(d => d && d.liveStorage).map(d => parseNumber(d.liveStorage)) || []
  );
  const outflowDomain = calculateAxisDomain([
    ...(filteredData?.filter(d => d && d.powerHouseDischarge).map(d => parseNumber(d.powerHouseDischarge)) || []),
    ...(filteredData?.filter(d => d && d.spillwayRelease).map(d => parseNumber(d.spillwayRelease)) || [])
  ]);

  // Calculate water level domains with safety checks
  const waterLevels = filteredData?.filter(d => d && d.waterLevel).map(d => parseFloat(d.waterLevel)) || [];
  const referenceLines = [
    parseFloat(damData.FRL),
    parseFloat(damData.redLevel),
    parseFloat(damData.orangeLevel),
    parseFloat(damData.blueLevel)
  ].filter(val => !isNaN(val) && val > 0);
  const waterLevelDomain = calculateAxisDomain([...waterLevels, ...referenceLines]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50 dark:from-black dark:to-slate-950">
      <Helmet>
        <title>{damData.name} Dam Water Levels</title>
        <meta name="description" content={`Current water level of ${damData.name} dam is ${currentData?.waterLevel || 'N/A'} meters.`} />
        <meta name="keywords" content={`${damData.name} dam, water levels, dam storage, inflow, outflow, rainfall`} />
        <meta property="og:title" content={`${damData.name} Dam Water Levels | Real-time Monitoring`} />
        <meta property="og:description" content={`Current water level of ${damData.name} dam is ${currentData?.waterLevel || 'N/A'} meters.`} />
        <meta property="og:image" content="/og-image.png" />
        <meta property="twitter:title" content={`${damData.name} Dam Water Levels | Real-time Monitoring`} />
        <meta property="twitter:description" content={`Current water level of ${damData.name} dam is ${currentData?.waterLevel || 'N/A'} meters.`} />
      </Helmet>
      
      <DamHeader 
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        isTimeRangeLoading={isTimeRangeLoading}
        currentDate={currentData?.date}
        referenceDate={referenceDate}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 p-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">
                  {damData.name} Dam Water Levels
                  {isHourlyTimeRange && (
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      (Hourly Data)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <DamStatusCards 
            currentData={currentData}
            damData={damData}
            waterLevelStats={waterLevelStats}
          />

          <motion.div 
            className="grid grid-cols-1 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.5
                }
              }
            }}
          >
            {/* Section 1: Specifications and Visualization */}
            <motion.div variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DamSpecifications damData={damData} />
                <Visualization
                  data={visualizationData}
                  currentIndex={visualizationIndex}
                  onIndexChange={setVisualizationIndex}
                  damData={damData}
                />
              </div>
            </motion.div>

            {/* Section 2: Water Level Trend */}
            <motion.div variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 }
            }}>
              <TrendChart
                title="Water Level Trend"
                icon={LineChart}
                iconColor="rgb(56, 189, 248)"
                data={filteredData?.filter(item => item && item.waterLevel).map(item => ({
                  ...item,
                  fullReservoirLevel: parseFloat(damData.FRL),
                  redAlertLevel: parseFloat(damData.redLevel),
                  orangeAlertLevel: parseFloat(damData.orangeLevel)
                })) || []}
                charts={[
                  { type: 'area', dataKey: 'waterLevel', color: 'rgb(56, 189, 248)', label: 'Water Level' },
                  { type: 'line', dataKey: 'fullReservoirLevel', color: 'rgb(34, 197, 94)', label: 'FRL' },
                  { type: 'line', dataKey: 'redAlertLevel', color: 'rgb(239, 68, 68)', label: 'Red Alert' },
                  { type: 'line', dataKey: 'orangeAlertLevel', color: 'rgb(249, 115, 22)', label: 'Orange Alert' }
                ]}
                unit="Ft"
                domain={waterLevelDomain}
              />
            </motion.div>

            {/* Section 3: Storage and Inflow */}
            <motion.div variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrendChart
                  title="Storage Trend"
                  icon={Building2}
                  iconColor="rgb(16, 185, 129)"
                  data={filteredData?.filter(item => item && (item.liveStorage || item.storagePercentage)).map(item => ({
                    ...item,
                    liveStorage: parseNumber(item.liveStorage),
                    storagePercentage: parseNumber(item.storagePercentage)
                  })) || []}
                  charts={[
                    { type: 'area', dataKey: 'liveStorage', color: 'rgb(16, 185, 129)', label: 'Live Storage' },
                    { type: 'line', dataKey: 'storagePercentage', color: 'rgb(234, 179, 8)', label: 'Storage %', yAxisId: 'right' }
                  ]}
                  unit="AF"
                  secondaryUnit="%"
                  domain={storageDomain}
                />

                <TrendChart
                  title="Inflow Trend"
                  icon={ArrowDown}
                  iconColor="rgb(59, 130, 246)"
                  data={filteredData?.filter(item => item && item.inflow !== undefined).map(item => ({
                    ...item,
                    inflow: parseNumber(item.inflow)
                  })) || []}
                  charts={[
                    { type: 'area', dataKey: 'inflow', color: 'rgb(59, 130, 246)', label: 'Inflow' }
                  ]}
                  unit="CFS"
                  domain={inflowDomain}
                />
              </div>
            </motion.div>

            {/* Section 4: Outflow and Rainfall */}
            <motion.div variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrendChart
                  title="Outflow Trend"
                  icon={ArrowUp}
                  iconColor="rgb(168, 85, 247)"
                  data={filteredData?.filter(item => item && (item.powerHouseDischarge || item.spillwayRelease)).map(item => ({
                    ...item,
                    powerHouseDischarge: parseNumber(item.powerHouseDischarge),
                    spillwayRelease: parseNumber(item.spillwayRelease)
                  })) || []}
                  charts={[
                    { type: 'line', dataKey: 'powerHouseDischarge', color: 'rgb(234, 179, 8)', label: 'Power House' },
                    { type: 'line', dataKey: 'spillwayRelease', color: 'rgb(239, 68, 68)', label: 'Spillway' }
                  ]}
                  unit="CFS"
                  domain={outflowDomain}
                />

                <TrendChart
                  title="Rainfall Trend"
                  icon={CloudRain}
                  iconColor="rgb(99, 102, 241)"
                  data={filteredData?.filter(item => item && item.rainfall !== undefined).map(item => ({
                    ...item,
                    rainfall: parseNumber(item.rainfall)
                  })) || []}
                  charts={[
                    { type: 'area', dataKey: 'rainfall', color: 'rgb(99, 102, 241)', label: 'Rainfall' }
                  ]}
                  unit="in"
                  domain={rainfallDomain}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="animate-pulse text-lg"
            >
              Loading dam data...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DamDetail;