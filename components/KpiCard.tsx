import React, { useEffect, useState } from 'react';
import { THEME_CONFIG } from '../constants';
import { ThemeType } from '../types';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  theme: ThemeType;
  testId?: string;
  isCurrency?: boolean;
}

const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend, trendUp, theme, testId, isCurrency }) => {
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  const isModern = isInnovation || isOcean || isTactical || isExecutive;
  
  // Parse numeric value for count-up
  const rawValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '').replace('M', '').replace('%', ''));
  const currentCount = isModern && !isNaN(rawValue) ? useCountUp(rawValue) : rawValue;

  // Formatting logic
  const formatDisplay = (val: number) => {
    if (isCurrency) {
        if (val >= 1000000) return (val / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M';
        return val.toLocaleString();
    }
    
    // If original value had a '%'
    if (String(value).includes('%')) {
        return val + '%';
    }

    return val.toLocaleString();
  };

  const formattedValue = isModern ? formatDisplay(currentCount) : value.toLocaleString();

  return (
    <div 
      data-testid={testId}
      className={`${styles.cardClass} p-6 h-full relative overflow-hidden group 
        ${isModern ? 'hover:scale-[1.02] active:scale-95 cursor-pointer border-l-4 border-l-transparent hover:border-l-current transition-all duration-300' : 'transition-all duration-300 hover:scale-105'}
        ${isInnovation ? 'hover:border-l-innovation-aurora' : ''}
        ${isOcean ? 'hover:border-l-ocean-neon' : ''}
        ${isTactical ? 'hover:border-l-ops-green' : ''}
        ${isExecutive ? 'hover:border-l-exec-gold' : ''}
      `}
    >
      <div className="flex justify-between items-start z-10 relative">
        <div className="flex-1">
          <p className={`${styles.textClass} text-xs font-bold uppercase tracking-widest mb-2 opacity-80`}>{title}</p>
          <h3 className={`${styles.primaryText} text-4xl font-bold tracking-tight`}>
            {formattedValue}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${
          isTactical ? 'bg-ops-green/20 text-ops-green border border-ops-green/50 shadow-[0_0_10px_rgba(57,255,20,0.4)]' : 
          isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/50 shadow-[0_0_10px_rgba(255,176,0,0.4)]' : 
          isInnovation ? 'bg-gradient-to-br from-blue-50 to-white text-innovation-aurora shadow-sm border border-white' :
          isOcean ? 'bg-ocean-neon/20 text-ocean-neon border border-ocean-neon/50 shadow-[0_0_10px_rgba(0,243,255,0.4)]' :
          'bg-gray-200 text-gray-600'
        }`}>
          <i className={`fas ${icon} text-xl ${isModern ? 'animate-pulse' : ''}`}></i>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-bold mr-2 px-2 py-0.5 rounded-full ${
            trendUp 
              ? (isInnovation ? 'bg-green-50 text-innovation-neon' : isOcean ? 'bg-ocean-neon/20 text-ocean-neon border border-ocean-neon/30' : isTactical ? 'bg-ops-green/20 text-ops-green border border-ops-green/30' : isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/30' : 'text-green-500') 
              : (isInnovation ? 'bg-red-50 text-red-500' : isOcean ? 'bg-red-500/20 text-white border border-red-500/50' : isTactical ? 'bg-red-500/20 text-white border border-red-500/50' : isExecutive ? 'bg-red-500/20 text-white border border-red-500/50' : 'text-red-500')
          }`}>
            <i className={`fas fa-arrow-${trendUp ? 'up' : 'down'} mr-1`}></i>
            {trend}
          </span>
          <span className={`${styles.textClass} text-xs opacity-60`}>vs last month</span>
        </div>
      )}

      {/* Modern Theme Decorative Elements */}
      {isModern && (
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700
          ${isInnovation ? 'bg-gradient-to-r from-blue-400/10 to-purple-400/10' : isOcean ? 'bg-ocean-neon/10' : isTactical ? 'bg-ops-green/10' : isExecutive ? 'bg-exec-gold/10' : 'bg-white/10'}
        `}></div>
      )}
    </div>
  );
};