/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Wind, Droplets, Sun, Thermometer, CloudRain, Cloud } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  type: "wind" | "hourly_humidity" | "uv" | "apparent" | "precipitation" | "cloud";
  numericValue: number; // For visualization meters
}

export default function MetricCard({ title, value, subValue, icon, type, numericValue }: MetricCardProps) {
  // Let's create a visual gauge or representation based on metric type
  const renderVisualGauge = () => {
    switch (type) {
      case "wind":
        // Rotate a dynamic wind direction indicator based on some arbitrary wind factors
        const rotation = (numericValue * 15) % 360;
        return (
          <div className="mt-4 flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
              <motion.div 
                style={{ rotate: rotation }}
                transition={{ type: "spring", stiffness: 60 }}
                className="text-sky-400"
              >
                ↑
              </motion.div>
            </div>
            <div className="text-xs text-slate-400 leading-tight">
              <span>Breeze index: </span>
              <span className="text-slate-200 font-medium font-mono">
                {numericValue < 10 ? "Light" : numericValue < 25 ? "Moderate" : "Strong"}
              </span>
            </div>
          </div>
        );

      case "hourly_humidity":
        return (
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                className="bg-blue-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, numericValue))}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Dry)</span>
              <span>100% (Wet)</span>
            </div>
          </div>
        );

      case "uv":
        // UV scale ranges: 0-2 (Low), 3-5 (Mod), 6-7 (High), 8-10 (Very High), 11+ (Extreme)
        let uvText = "Low";
        let uvColor = "bg-green-500";
        if (numericValue >= 11) {
          uvText = "Extreme";
          uvColor = "bg-purple-600";
        } else if (numericValue >= 8) {
          uvText = "Very High";
          uvColor = "bg-red-500";
        } else if (numericValue >= 6) {
          uvText = "High";
          uvColor = "bg-orange-500";
        } else if (numericValue >= 3) {
          uvText = "Moderate";
          uvColor = "bg-yellow-500";
        }
        
        const uvPercent = Math.min(100, (numericValue / 12) * 100);

        return (
          <div className="mt-4 space-y-2">
            <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                className={`h-full rounded-full ${uvColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${uvPercent}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Risk index:</span>
              <span className="text-slate-200 font-semibold font-mono">{uvText}</span>
            </div>
          </div>
        );

      case "apparent":
        return (
          <div className="mt-4 flex flex-col justify-end text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Thermal profile: </span>
              <span className="text-slate-200 font-medium font-mono">
                {subValue || "Normalized"}
              </span>
            </div>
          </div>
        );

      case "precipitation":
        return (
          <div className="mt-4 flex flex-col justify-end text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Volume rate: </span>
              <span className="text-slate-200 font-medium font-mono">
                {numericValue > 0 ? `${numericValue.toFixed(1)} mm` : "Dry conditions"}
              </span>
            </div>
          </div>
        );

      case "cloud":
        return (
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                className="bg-sky-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${numericValue}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Clear)</span>
              <span>100% (Overcast)</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(100, 116, 139, 0.4)" }}
      className="bg-slate-800/40 border border-slate-700/30 backdrop-blur-md rounded-2xl p-5 shadow-lg shadow-slate-900/10 flex flex-col justify-between h-40 transition-shadow hover:shadow-slate-900/35"
    >
      <div className="flex justify-between items-start">
        <span className="text-slate-400 font-medium text-xs tracking-wider uppercase">{title}</span>
        <div className="text-slate-400 p-1 bg-slate-900/30 rounded-lg">{icon}</div>
      </div>
      <div>
        <h4 className="text-slate-100 font-sans font-semibold text-2xl tracking-tight leading-none mt-2">
          {value}
        </h4>
        {renderVisualGauge()}
      </div>
    </motion.div>
  );
}
