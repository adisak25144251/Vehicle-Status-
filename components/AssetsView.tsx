
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Vehicle, ThemeType } from '../types';
import { THEME_CONFIG } from '../constants';
import { analyzeAssetRegistration } from '../services/geminiService';

interface AssetsViewProps {
  vehicles: Vehicle[];
  theme: ThemeType;
  onUploadClick: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ vehicles, theme, onUploadClick }) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const styles = THEME_CONFIG[theme];
  
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  const isColorful = theme === ThemeType.OFFICIAL;

  const handleIntelligentAnalysis = async () => {
    if (vehicles.length === 0) return;
    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeAssetRegistration(vehicles);
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult("เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลอัจฉริยะ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['หมายเลขทะเบียน', 'หน่วยงาน', 'ประเภท', 'ยี่ห้อ', 'สถานะ', 'ปีที่จัดซื้อ', 'มูลค่า', 'เลขเครื่อง'];
    const sampleData = [
       ['1กข-5678', 'ฝ่ายส่งกำลังบำรุง', 'รถกระบะ', 'Toyota', 'ใช้การได้', 2565, 850000, '2GD-8812'],
       ['9ฮฮ-1122', 'กองกำกับการ 2', 'รถตู้', 'Nissan', 'ชำรุด', 2558, 1200000, 'YD2-9911'],
       ['โล่ 99123', 'ศูนย์ฝึกอบรม', 'รถบรรทุก', 'Isuzu', 'รอจำหน่าย', 2550, 2500000, '6HK-1122'],
       ['4กย-4455', 'สภ.เมือง', 'รถเก๋ง', 'Honda', 'ใช้การได้', 2566, 750000, 'L15-3344'],
       ['2ขข-1111', 'หน่วยปฏิบัติการพิเศษ', 'รถจักรยานยนต์', 'Yamaha', 'ใช้การได้', 2564, 120000, 'G3B-5566']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    
    // Auto-width for columns
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Fleet_Template");
    XLSX.writeFile(wb, "BPP_Fleet_Master_Template.xlsx");
  };

  const copyResult = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      alert("คัดลอกรายงานผลการวิเคราะห์แล้ว");
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Header Actions Area */}
      <div className={`p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden
        ${isColorful ? 'bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 
          isExecutive ? 'bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_25px_50px_rgba(0,0,0,0.5)]' :
          isInnovation ? 'glass-prism bg-innovation-layer1/50 border-innovation-primary/20' : styles.cardClass}
      `}>
        <div className="relative z-10 text-center lg:text-left">
          <h2 className={`text-3xl font-black mb-2 flex items-center justify-center lg:justify-start gap-3 ${styles.primaryText}`}>
            <i className="fas fa-database"></i>
            ระบบทะเบียนยานพาหนะอัจฉริยะ
          </h2>
          <p className={`${styles.textClass} opacity-80 font-medium max-w-xl`}>
            เครื่องมือสกัดข้อมูลและประเมินคุณภาพ Master Data (Gov/Business Grade) 
            พร้อมระบบตรวจสอบธรรมาภิบาลและการแก้ภาษาไทยอัตโนมัติ
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 relative z-10">
           <button 
            onClick={handleDownloadTemplate}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border
              ${isColorful ? 'bg-white/5 text-white border-white/20 hover:bg-white/10' :
                isExecutive ? 'bg-white/5 text-exec-gold border-white/20 hover:bg-white/10' :
                isOcean ? 'bg-white/5 text-ocean-neon border-ocean-neon/30 hover:bg-white/10' :
                isTactical ? 'bg-white/5 text-ops-green border-ops-green/30 hover:bg-white/10' : 
                isInnovation ? 'bg-white/5 text-innovation-secondary border-innovation-secondary/30 hover:bg-white/10' :
                'bg-white text-gray-700 border-gray-200'}
            `}
            title="ดาวน์โหลดไฟล์ตัวอย่าง Excel"
          >
            <i className="fas fa-file-arrow-down"></i> โหลด Template
          </button>

          <button 
            onClick={onUploadClick}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl
              ${isColorful ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white' :
                isExecutive ? 'bg-exec-gold text-black' :
                isOcean ? 'bg-ocean-neon text-black' :
                isTactical ? 'bg-ops-green text-black' : 
                isInnovation ? 'bg-gradient-to-r from-innovation-primary to-innovation-secondary text-white shadow-innovation-primary/40' :
                'bg-blue-600 text-white'}
            `}
          >
            <i className="fas fa-file-excel"></i> นำเข้าไฟล์ (Excel/Master)
          </button>
          
          <button 
            onClick={handleIntelligentAnalysis}
            disabled={loading || vehicles.length === 0}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border shadow-xl
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              ${isColorful ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' :
                isExecutive ? 'bg-white/10 text-exec-gold border-white/20 hover:bg-white/20' :
                isOcean ? 'bg-ocean-neon/10 text-ocean-neon border-ocean-neon/30 hover:bg-ocean-neon/20' :
                isTactical ? 'bg-ops-green/10 text-ops-green border-ops-green/30 hover:bg-ops-green/20' : 
                isInnovation ? 'bg-white/10 text-innovation-neon border-innovation-secondary/30 hover:bg-white/20' :
                'bg-gray-100 text-gray-700'}
            `}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            วิเคราะห์ทะเบียนอัจฉริยะ (AI Audit)
          </button>
        </div>

        {/* Decorative Background Pulsing */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 animate-pulse
            ${isColorful ? 'bg-[#ff0080]' : isExecutive ? 'bg-exec-gold' : isOcean ? 'bg-ocean-neon' : isTactical ? 'bg-ops-green' : isInnovation ? 'bg-innovation-primary' : 'bg-blue-400'}
        `}></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assets Master Table */}
        <div className={`lg:col-span-7 ${styles.cardClass} overflow-hidden h-[750px] flex flex-col shadow-2xl`}>
          <div className={`p-6 border-b shrink-0 flex justify-between items-center ${isInnovation ? 'border-innovation-primary/20' : 'border-white/10'}`}>
            <h3 className={`${styles.primaryText} font-bold text-xl uppercase tracking-widest`}>Asset Master Data</h3>
            <span className={`px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest ${isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/30' : isColorful ? 'bg-white/10 text-white border border-white/20' : isInnovation ? 'bg-innovation-layer1/50 text-innovation-neon border border-innovation-secondary/30' : 'bg-white/10 text-white'}`}>
               Master Records: {vehicles.length}
            </span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className={`uppercase text-[10px] font-black tracking-widest sticky top-0 backdrop-blur-xl z-10 
                ${isExecutive ? 'bg-[#0a0a1a]/95 text-exec-gold' : isColorful ? 'bg-[#0a0a0f]/95 text-[#ff0080]' : isInnovation ? 'bg-black/80 text-innovation-secondary' : 'bg-black/80 text-white'} border-b border-white/10`}>
                <tr>
                  <th className="px-6 py-5">ทะเบียน/หมายเลขโล่</th>
                  <th className="px-6 py-5">ยี่ห้อ/ประเภท</th>
                  <th className="px-6 py-5">หน่วยงานสังกัด</th>
                  <th className="px-6 py-5">สถานภาพ</th>
                  <th className="px-6 py-5 text-right">มูลค่าทรัพย์สิน</th>
                </tr>
              </thead>
              <tbody className={`${styles.textClass} font-medium`}>
                {vehicles.length > 0 ? vehicles.map((v, i) => (
                  <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-all duration-300`}>
                    <td className="px-6 py-4 font-black text-base">{v.plate_no}</td>
                    <td className="px-6 py-4">
                      <div className="font-black text-xs uppercase">{v.vehicle_type}</div>
                      <div className="text-[10px] opacity-50 uppercase tracking-tighter">{v.brand}</div>
                    </td>
                    <td className="px-6 py-4">{v.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest
                        ${v.condition_status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          v.condition_status === 'Maintenance' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {v.condition_status === 'Active' ? 'ใช้การได้' : v.condition_status === 'Maintenance' ? 'ชำรุด' : 'รอจำหน่าย'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black">{v.asset_value.toLocaleString()} ฿</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-20 text-center opacity-30 italic">ไม่พบข้อมูลในระบบ กรุณานำเข้าไฟล์ Excel</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Report Area */}
        <div className={`lg:col-span-5 ${styles.cardClass} p-6 h-[750px] flex flex-col relative overflow-hidden shadow-2xl`}>
           <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg
                    ${isColorful ? 'bg-gradient-to-tr from-[#ff0080] to-[#7928ca]' : isExecutive ? 'bg-exec-gold' : isInnovation ? 'bg-gradient-to-tr from-innovation-primary to-innovation-secondary' : 'bg-blue-600'} text-white`}>
                  <i className="fas fa-wand-sparkles"></i>
                </div>
                <div>
                  <h3 className={`${styles.primaryText} font-black text-xl leading-none mb-1`}>AI Extraction Report</h3>
                  <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${styles.textClass} opacity-60`}>World-Class Intelligence Architecture</span>
                </div>
              </div>
              {analysisResult && !loading && (
                <button 
                  onClick={copyResult}
                  className={`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all ${styles.textClass}`}
                  title="Copy Report to Clipboard"
                >
                  <i className="fas fa-copy"></i>
                </button>
              )}
           </div>

           <div className={`flex-1 overflow-y-auto custom-scrollbar pr-2 relative ${loading ? 'flex flex-col items-center justify-center' : ''}`}>
              {loading ? (
                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className={`w-20 h-20 border-4 border-t-transparent rounded-full animate-spin
                        ${isColorful ? 'border-[#ff0080]' : isExecutive ? 'border-exec-gold' : isInnovation ? 'border-innovation-primary' : 'border-blue-500'}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className={`fas fa-robot text-2xl ${isColorful ? 'text-[#ff0080]' : isExecutive ? 'text-exec-gold' : isInnovation ? 'text-innovation-neon' : 'text-blue-500'}`}></i>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={`${styles.textClass} font-black text-lg animate-pulse`}>กำลังดำเนินการสกัดข้อมูลและตรวจสอบคุณภาพ...</p>
                    <p className={`${styles.textClass} text-xs opacity-50 uppercase tracking-widest`}>Thai Language Auto-Correction Layer: Active</p>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className={`prose prose-invert max-w-none text-sm leading-relaxed ${styles.textClass}`}>
                  <div className="whitespace-pre-line font-medium opacity-90 pb-10">
                    {analysisResult}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-12 select-none">
                  <i className="fas fa-brain-circuit text-8xl mb-8"></i>
                  <h4 className="text-2xl font-black mb-3">ระบบพร้อมวิเคราะห์อัจฉริยะ</h4>
                  <p className="font-bold text-sm">คลิก "วิเคราะห์ทะเบียนอัจฉริยะ" เพื่อรันโมเดล AI ในการจัดกลุ่ม Data Domain, ตรวจสอบความถูกต้องของภาษาไทย และประเมินคุณภาพข้อมูล Master Data ของ ตชด.</p>
                </div>
              )}
           </div>

           {/* Decorative corner icon */}
           <div className={`absolute -bottom-10 -right-10 text-[12rem] opacity-[0.03] select-none pointer-events-none ${styles.textClass}`}>
              <i className="fas fa-shield-halved"></i>
           </div>
        </div>
      </div>
    </div>
  );
};
