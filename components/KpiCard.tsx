
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
        ${isModern ? 'hover:scale-[1.02] active:scale-95 cursor-pointer border-l-4 border-l-transparent hover:border-l-current transition-all duration-300 shadow-lg hover:shadow-2xl' : 'transition-all duration-300 hover:scale-105'}
        ${isInnovation ? 'hover:border-l-innovation-primary' : ''}
        ${isOcean ? 'hover:border-l-ocean-neon' : ''}
        ${isTactical ? 'hover:border-l-ops-green' : ''}
        ${isExecutive ? 'hover:border-l-exec-gold' : ''}
      `}
    >
      <div className="flex justify-between items-start z-10 relative">
        <div className="flex-1">
          <p className={`${styles.textClass} text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-60`}>{title}</p>
          <h3 className={`${styles.primaryText} text-4xl font-bold tracking-tight mb-2`}>
            {formattedValue}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl transition-all duration-500 group-hover:rotate-12 ${
          isTactical ? 'bg-ops-green/20 text-ops-green border border-ops-green/50 shadow-[0_0_10px_rgba(57,255,20,0.4)]' : 
          isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/50 shadow-[0_0_10px_rgba(255,176,0,0.4)]' : 
          isInnovation ? 'bg-innovation-layer1/50 text-innovation-primary shadow-[0_0_15px_rgba(217,70,239,0.3)] border border-innovation-primary/30' :
          isOcean ? 'bg-ocean-neon/20 text-ocean-neon border border-ocean-neon/50 shadow-[0_0_10px_rgba(0,243,255,0.4)]' :
          'bg-gray-200 text-gray-600'
        }`}>
          <i className={`fas ${icon} text-xl ${isModern ? 'animate-pulse' : ''}`}></i>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-xs font-bold mr-2 px-2 py-0.5 rounded-md flex items-center gap-1 ${
            trendUp 
              ? (isInnovation ? 'bg-innovation-neon/20 text-innovation-neon border border-innovation-neon/30' : isOcean ? 'bg-ocean-neon/20 text-ocean-neon border border-ocean-neon/30' : isTactical ? 'bg-ops-green/20 text-ops-green border border-ops-green/30' : isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/30' : 'text-green-500') 
              : (isInnovation ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isOcean ? 'bg-red-500/20 text-white border border-red-500/50' : isTactical ? 'bg-red-500/20 text-white border border-red-500/50' : isExecutive ? 'bg-red-500/20 text-white border border-red-500/50' : 'text-red-500')
          }`}>
            <i className={`fas fa-arrow-${trendUp ? 'up' : 'down'} text-[10px]`}></i>
            {trend}
          </span>
          <span className={`${styles.textClass} text-[10px] uppercase font-bold opacity-40`}>vs last month</span>
        </div>
      )}

      {/* Decorative Sparkline Effect */}
      <div className={`absolute bottom-0 left-0 right-0 h-16 opacity-10 pointer-events-none`}>
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
             <path d="M0,20 L0,10 L10,15 L20,5 L30,12 L40,8 L50,15 L60,5 L70,18 L80,10 L90,15 L100,0 L100,20 Z" fill="currentColor" className={styles.textClass} />
          </svg>
      </div>

      {/* Modern Theme Decorative Elements */}
      {isModern && (
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-30
          ${isInnovation ? 'bg-innovation-primary animate-pulse-neon' : isOcean ? 'bg-ocean-neon' : isTactical ? 'bg-ops-green' : isExecutive ? 'bg-exec-gold' : 'bg-white'}
        `}></div>
      )}
    </div>
  );
};
