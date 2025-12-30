import React from 'react';
import { THEME_CONFIG } from '../constants';
import { ThemeType } from '../types';

interface AiInsightProps {
  insight: string;
  loading: boolean;
  onRefresh: () => void;
  theme: ThemeType;
  testId?: string;
}

export const AiInsight: React.FC<AiInsightProps> = ({ insight, loading, onRefresh, theme, testId }) => {
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  
  const isModern = isInnovation || isOcean || isTactical || isExecutive;

  return (
    <div 
      data-testid={testId}
      className={`
        ${styles.cardClass} 
        p-6 relative overflow-hidden group h-[480px] flex flex-col
      `}
    >
      {/* Background effects */}
      {isTactical && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-ops-green/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none animate-pulse"></div>
      )}
      {isExecutive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-exec-gold/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none animate-pulse"></div>
      )}
      {isInnovation && (
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none animate-blob"></div>
      )}
      {isOcean && (
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-ocean-neon/20 blur-3xl rounded-full pointer-events-none animate-blob"></div>
      )}

      {/* Header - Sticky at top */}
      <div className="flex justify-between items-center mb-4 z-10 shrink-0">
        <h3 className={`${styles.primaryText} text-lg font-bold flex items-center`}>
          {isModern ? (
            <span className={`flex h-8 w-8 items-center justify-center rounded-full mr-3 shadow-lg ${isOcean ? 'bg-ocean-neon/20 border border-ocean-neon/50' : isTactical ? 'bg-ops-green/20 border border-ops-green/50' : isExecutive ? 'bg-exec-gold/20 border border-exec-gold/50' : 'bg-gradient-to-r from-blue-50 to-purple-600'}`}>
              <i className={`fas ${isTactical || isExecutive || isOcean ? 'fa-terminal' : 'fa-sparkles'} text-xs ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : 'text-white'}`}></i>
            </span>
          ) : (
            <i className="fas fa-robot mr-2"></i>
          )}
          {isInnovation ? 'การวิเคราะห์เชิงลึกด้วย AI' : isOcean ? 'Cyber-Sea Intelligence' : isTactical ? 'ข้อมูลยุทธการดิจิทัล' : isExecutive ? 'ระบบข่าวกรองสำหรับผู้บริหาร' : 'AI Command Insight'}
        </h3>
        <button 
          data-testid="widget-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          className={`
            px-3 py-1 rounded-full text-sm transition-all duration-300 font-bold
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-100 hover:shadow-lg active:scale-95'} 
            ${isTactical ? 'bg-ops-green text-black shadow-[0_0_10px_rgba(57,255,20,0.6)]' : 
              isExecutive ? 'bg-exec-gold text-black shadow-[0_0_10px_rgba(255,176,0,0.6)]' :
              isInnovation ? 'bg-blue-600 text-white shadow-sm' : 
              isOcean ? 'bg-ocean-neon text-black shadow-[0_0_10px_rgba(0,243,255,0.6)]' :
              'bg-blue-600 text-white'}
          `}
        >
          {loading ? (
            <span><i className="fas fa-circle-notch fa-spin mr-1"></i> กำลังประมวลผล</span>
          ) : (
            <span><i className="fas fa-sync-alt mr-1"></i> วิเคราะห์ใหม่</span>
          )}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar pr-2 z-10 relative ${styles.primaryText} font-bold`}>
        {loading ? (
            <div className="animate-pulse flex flex-col space-y-3 pt-2">
                <div className={`h-2 rounded w-3/4 ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : isExecutive ? 'bg-exec-gold/20' : 'bg-gray-500/20'}`}></div>
                <div className={`h-2 rounded w-full ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : isExecutive ? 'bg-exec-gold/20' : 'bg-gray-500/20'}`}></div>
                <div className={`h-2 rounded w-5/6 ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : isExecutive ? 'bg-exec-gold/20' : 'bg-gray-500/20'}`}></div>
                <div className={`h-2 rounded w-1/2 ${isInnovation ? 'bg-gray-200' : isOcean ? 'bg-ocean-neon/20' : isTactical ? 'bg-ops-green/20' : isExecutive ? 'bg-exec-gold/20' : 'bg-gray-500/20'}`}></div>
            </div>
        ) : (
          <p className={`leading-relaxed text-sm md:text-base whitespace-pre-line animate-slide-up drop-shadow-sm`}>
            {insight}
          </p>
        )}
      </div>

      {/* Footer - Sticky at bottom */}
      <div className={`mt-4 pt-3 border-t shrink-0 z-10 ${
        isTactical ? 'border-ops-green/30' : 
        isExecutive ? 'border-exec-gold/30' :
        isInnovation ? 'border-indigo-100' :
        isOcean ? 'border-ocean-neon/30' :
        'border-gray-200/20'
      } flex items-center text-xs font-bold ${isModern ? styles.primaryText : 'text-gray-500'}`}>
        <i className={`fas fa-shield-alt mr-2 ${isInnovation ? 'text-blue-600' : ''}`}></i>
        <span className="opacity-80">
          ช่องทางข้อมูลเข้ารหัสความปลอดภัยสูง • Gemini 3.0 Pro
        </span>
      </div>
    </div>
  );
};