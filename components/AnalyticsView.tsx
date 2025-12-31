
import React, { useState } from 'react';
import { ThemeType, Vehicle } from '../types';
import { THEME_CONFIG } from '../constants';
import { generateGovernanceAnalysis } from '../services/geminiService';

interface AnalyticsViewProps {
  vehicles: Vehicle[];
  theme: ThemeType;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ vehicles, theme }) => {
  const [report, setReport] = useState<string | null>(null);
  const [jsonSpec, setJsonSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;

  const handleAnalyze = async () => {
    setLoading(true);
    setReport(null);
    setJsonSpec(null);
    
    try {
        const result = await generateGovernanceAnalysis(vehicles);
        
        // Split Markdown and JSON
        const jsonMatch = result.match(/```json([\s\S]*?)```/);
        let parsedJson = null;
        let cleanReport = result;

        if (jsonMatch && jsonMatch[1]) {
            parsedJson = jsonMatch[1].trim();
            cleanReport = result.replace(/```json[\s\S]*?```/, '').trim();
        }

        setReport(cleanReport);
        setJsonSpec(parsedJson);

    } catch (e) {
        setReport("เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6 pb-20">
        {/* Header Section */}
        <div className={`p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6
             ${isInnovation ? 'glass-prism bg-innovation-layer1/50 border-innovation-primary/20 shadow-[0_0_30px_rgba(217,70,239,0.15)]' : isOcean ? 'bg-ocean-neon/5 border border-ocean-neon/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,243,255,0.1)]' : isTactical ? 'bg-black/60 border border-ops-green/40 shadow-[0_0_30px_rgba(57,255,20,0.1)]' : styles.cardClass}
        `}>
             <div className="relative z-10">
                 <h2 className={`text-3xl font-bold mb-2 ${isOcean ? 'text-ocean-neon drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]' : isTactical ? 'text-ops-green drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]' : styles.primaryText}`}>
                    <i className="fas fa-chart-network mr-3"></i>
                    Fleet Governance Analytics
                 </h2>
                 <p className={`text-lg opacity-80 ${styles.textClass}`}>
                    ระบบวิเคราะห์ธรรมาภิบาลกองยานและการตรวจสอบย้อนกลับ (Advanced AI Audit)
                 </p>
             </div>
             
             <div className="relative z-10">
                 <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className={`
                        px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center gap-3
                        ${loading ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}
                        ${isInnovation 
                            ? 'bg-gradient-to-r from-innovation-primary to-innovation-secondary text-white shadow-innovation-primary/40' 
                            : isOcean 
                                ? 'bg-ocean-neon text-black hover:bg-white shadow-[0_0_20px_rgba(0,243,255,0.4)]' 
                                : isTactical 
                                    ? 'bg-ops-green text-black hover:bg-white shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                                    : 'bg-blue-600 text-white'}
                    `}
                 >
                    {loading ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> กำลังประมวลผลข้อมูล...</>
                    ) : (
                        <><i className="fas fa-microchip"></i> เริ่มการวิเคราะห์เชิงลึก</>
                    )}
                 </button>
             </div>

             {/* Background Effects */}
             {isTactical && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>}
             {isOcean && <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-ocean-neon/10 rounded-full blur-3xl animate-pulse-neon"></div>}
             {isInnovation && <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-innovation-primary/10 rounded-full blur-3xl animate-pulse-neon"></div>}
        </div>

        {/* Content Area */}
        {loading && (
            <div className={`p-12 text-center rounded-3xl ${styles.cardClass} animate-pulse`}>
                <div className={`inline-block p-6 rounded-full mb-6 ${isOcean ? 'bg-ocean-neon/10 text-ocean-neon' : isTactical ? 'bg-ops-green/10 text-ops-green' : isInnovation ? 'bg-innovation-layer1/50 text-innovation-primary' : 'bg-gray-100'}`}>
                    <i className="fas fa-brain-circuit text-5xl fa-spin-slow"></i>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${styles.primaryText}`}>AI กำลังตรวจสอบความคุ้มค่าและธรรมาภิบาล (3Es Analysis)</h3>
                <p className={styles.textClass}>กำลังวิเคราะห์ TCO, LCC และค้นหาความผิดปกติของข้อมูล...</p>
            </div>
        )}

        {report && !loading && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Narrative Report */}
                <div className={`p-8 rounded-3xl overflow-y-auto max-h-[800px] custom-scrollbar
                    ${isInnovation ? 'bg-black/40 border border-innovation-primary/20 shadow-lg text-white' : isOcean ? 'bg-black/40 border border-ocean-neon/30 backdrop-blur-md' : isTactical ? 'bg-black/40 border border-ops-green/30' : styles.cardClass}
                `}>
                    <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4 ${isInnovation ? 'border-innovation-primary/30 text-innovation-neon' : isOcean ? 'border-ocean-neon/30 text-ocean-neon' : isTactical ? 'border-ops-green/30 text-ops-green' : 'border-gray-200 text-gray-800'}`}>
                        <i className="fas fa-file-alt"></i> รายงานสรุปสำหรับผู้บริหาร
                    </h3>
                    <div className={`prose max-w-none whitespace-pre-line leading-relaxed ${isInnovation ? 'text-white/90' : isOcean ? 'text-ocean-neon/90' : isTactical ? 'text-ops-green/90' : 'text-gray-700'}`}>
                        {report}
                    </div>
                </div>

                {/* Technical Spec / JSON */}
                <div className={`p-8 rounded-3xl flex flex-col
                    ${isInnovation ? 'bg-black/60 border border-innovation-secondary/30 text-white' : isOcean ? 'bg-black/80 border border-ocean-neon/30 backdrop-blur-md' : isTactical ? 'bg-black/80 border border-ops-green/30' : 'bg-gray-900 text-white'}
                `}>
                    <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4 ${isInnovation ? 'border-innovation-secondary/30 text-innovation-secondary' : isOcean ? 'border-ocean-neon/30 text-ocean-neon' : isTactical ? 'border-ops-green/30 text-ops-green' : 'border-gray-700 text-gray-300'}`}>
                        <i className="fas fa-code"></i> Generated Dashboard Spec (JSON)
                    </h3>
                    
                    {jsonSpec ? (
                        <div className="relative flex-1 overflow-hidden rounded-xl bg-black/50 border border-white/5">
                             <pre className={`p-4 text-xs md:text-sm font-mono overflow-auto h-full max-h-[700px] custom-scrollbar ${isInnovation ? 'text-fuchsia-300' : isOcean ? 'text-cyan-400' : isTactical ? 'text-green-400' : 'text-green-400'}`}>
                                <code>{jsonSpec}</code>
                             </pre>
                             <div className="absolute top-2 right-2">
                                 <button 
                                    onClick={() => navigator.clipboard.writeText(jsonSpec)}
                                    className={`text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors ${isInnovation ? 'text-innovation-secondary' : isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : 'text-white'}`}
                                 >
                                     <i className="fas fa-copy"></i> Copy
                                 </button>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center opacity-50 italic">
                            ไม่พบโครงสร้าง JSON ในผลลัพธ์
                        </div>
                    )}
                </div>

            </div>
        )}

        {!report && !loading && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70">
                 {[
                    { icon: 'fa-search-dollar', title: 'Value for Money', desc: 'วิเคราะห์ความคุ้มค่า 3Es (Economy, Efficiency, Effectiveness)' },
                    { icon: 'fa-shield-check', title: 'Audit Trail', desc: 'ตรวจสอบร่องรอยการแก้ไขและธรรมาภิบาลข้อมูล' },
                    { icon: 'fa-chart-line-down', title: 'TCO Reduction', desc: 'วิเคราะห์ต้นทุนรวมตลอดอายุการใช้งานเพื่อลดรายจ่าย' }
                 ].map((item, idx) => (
                     <div key={idx} className={`p-6 rounded-2xl text-center border border-dashed border-transparent hover:border-current transition-all ${isInnovation ? 'text-innovation-secondary hover:bg-innovation-layer1/30' : isOcean ? 'text-ocean-neon hover:bg-ocean-neon/5' : isTactical ? 'text-ops-green hover:bg-ops-green/5' : 'text-gray-500 hover:bg-gray-50'}`}>
                         <i className={`fas ${item.icon} text-4xl mb-4 opacity-80`}></i>
                         <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                         <p className="text-sm opacity-80">{item.desc}</p>
                     </div>
                 ))}
             </div>
        )}
    </div>
  );
};
