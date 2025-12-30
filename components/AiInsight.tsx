import React from 'react';
import { THEME_CONFIG } from '../constants';
import { ThemeType } from '../types';

interface AiInsightProps {
  theme: ThemeType;
  insight: string;
  loading: boolean;
  onRefresh: () => void;
}

export const AiInsight: React.FC<AiInsightProps> = ({ theme, insight, loading, onRefresh }) => {
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;

  return (
    <div className={`${styles.cardClass} p-6 flex flex-col relative overflow-hidden h-full min-h-[250px]`}>
      <div className="flex justify-between items-center mb-4 z-10">
        <h3 className={`${styles.primaryText} font-bold flex items-center gap-2`}>
          <i className={`fas fa-sparkles ${loading ? 'animate-spin' : ''}`}></i>
          ข้อมูลวิเคราะห์เชิงลึกโดย AI
        </h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          title="รีเฟรชการวิเคราะห์"
          className={`p-2 rounded-lg transition-all ${isInnovation ? 'hover:bg-blue-50 text-blue-600' : isOcean ? 'hover:bg-ocean-neon/10 text-ocean-neon' : isTactical ? 'hover:bg-ops-green/10 text-ops-green' : isExecutive ? 'hover:bg-exec-gold/10 text-exec-gold' : 'hover:bg-gray-100'}`}
        >
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className={`flex-1 relative z-10 ${loading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300 custom-scrollbar overflow-y-auto pr-2`}>
        {loading ? (
          <div className="flex flex-col gap-3">
            <div className={`h-4 w-full rounded animate-pulse ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : 'bg-white/10'}`}></div>
            <div className={`h-4 w-[90%] rounded animate-pulse ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : 'bg-white/10'}`}></div>
            <div className={`h-4 w-[95%] rounded animate-pulse ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : 'bg-white/10'}`}></div>
            <div className={`h-4 w-[85%] rounded animate-pulse ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : 'bg-white/10'}`}></div>
          </div>
        ) : (
          <div className={`${styles.textClass} text-sm leading-relaxed whitespace-pre-line font-medium`}>
            {insight}
          </div>
        )}
      </div>

      {/* Decorative pulse for AI feel */}
      {!loading && (
        <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-20 animate-pulse
          ${isInnovation ? 'bg-blue-400' : isOcean ? 'bg-ocean-neon' : isTactical ? 'bg-ops-green' : isExecutive ? 'bg-exec-gold' : 'bg-blue-400'}
        `}></div>
      )}
    </div>
  );
};