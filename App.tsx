
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_VEHICLES, THEME_CONFIG } from './constants';
import { Vehicle, ThemeType, DashboardMetrics } from './types';
import { KpiCard } from './components/KpiCard';
import { StatusDonutChart, DepartmentBarChart, AgePieChart } from './components/Charts';
import { AiInsight } from './components/AiInsight';
import { AiBot } from './components/AiBot';
import { AnalyticsView } from './components/AnalyticsView';
import { AssetsView } from './components/AssetsView';
import { FileUploadModal } from './components/FileUploadModal';
import { generateFleetInsight } from './services/geminiService';

const App: React.FC = () => {
  // Application State
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'assets' | 'settings'>('dashboard');
  
  // Persistence Logic: Load from localStorage or use MOCK_VEHICLES
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('fleet_vehicles_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_VEHICLES;
      }
    }
    return MOCK_VEHICLES;
  });

  const [theme, setTheme] = useState<ThemeType>(ThemeType.OFFICIAL);
  const [insight, setInsight] = useState<string>("สรุปภาพรวมยานพาหนะมีอัตราความพร้อมปฏิบัติการ (Readiness Rate) เพียง 67% โดยมีรถที่อยู่ระหว่างซ่อมบำรุงและรอจำหน่ายรวมถึง 1 ใน 3 ของจำนวนทั้งหมด ซึ่งถือเป็นความเสี่ยงระดับสูงต่อการสนับสนุนภารกิจยุทธวิธีของหน่วยสายตรวจและปฏิบัติการพิเศษที่ต้องใช้ความคล่องตัวสูง ความบกพร่องด้านความพร้อมรบนี้สะท้อนถึงภาวะเสื่อมสภาพของสินทรัพย์มูลค่า 18.52 ล้านบาท ที่อาจกระทบต่อประสิทธิภาพการสนองตอบภารกิจป้องกันชายแดนในระยะยาว จึงขอเสนอให้เร่งรัดงบประมาณเพื่อการจัดหาทดแทน (Replacement) รถที่รอจำหน่ายโดยเร่งด่วน และเพิ่มงบประมาณซ่อมบำรุงเชิงป้องกัน (Preventive Maintenance) เพื่อรักษาเสถียรภาพของกำลังพลและยานพาหนะให้อยู่ในระดับมาตรฐานสูงสุด");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Save to localStorage whenever vehicles state changes
  useEffect(() => {
    localStorage.setItem('fleet_vehicles_data', JSON.stringify(vehicles));
  }, [vehicles]);

  // Filters
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterAgeMin, setFilterAgeMin] = useState<string>(''); 
  const [filterAgeMax, setFilterAgeMax] = useState<string>(''); 
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  const isColorful = theme === ThemeType.OFFICIAL;

  // Clear All Filters Helper
  const clearAllFilters = useCallback(() => {
    setFilterDept('All');
    setFilterType('All');
    setFilterStatus('All');
    setFilterAgeMin('');
    setFilterAgeMax('');
    setSearchTerm('');
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return filterDept !== 'All' || filterType !== 'All' || filterStatus !== 'All' || filterAgeMin !== '' || filterAgeMax !== '' || searchTerm !== '';
  }, [filterDept, filterType, filterStatus, filterAgeMin, filterAgeMax, searchTerm]);

  // Derived Data: Filtering Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const currentYear = new Date().getFullYear();
      // Age calculation logic: handle both AD and BE years just in case
      const vYear = v.purchase_year || currentYear;
      const normalizedVYear = vYear > 2400 ? vYear - 543 : vYear;
      const serviceAge = currentYear - normalizedVYear;

      const matchDept = filterDept === 'All' || v.department === filterDept;
      const matchType = filterType === 'All' || v.vehicle_type === filterType;
      
      // Status Mapping for consistency with charts
      let currentStatus = v.condition_status;
      if (filterStatus !== 'All') {
          const statusMap: Record<string, string> = {
              'ใช้การได้': 'Active',
              'ชำรุด': 'Maintenance',
              'รอจำหน่าย': 'Disposal',
              'Active': 'Active',
              'Maintenance': 'Maintenance',
              'Disposal': 'Disposal'
          };
          if (statusMap[filterStatus] && currentStatus !== statusMap[filterStatus]) return false;
          if (!statusMap[filterStatus] && currentStatus !== filterStatus) return false;
      }

      const minAge = filterAgeMin === '' ? -Infinity : parseInt(filterAgeMin);
      const maxAge = filterAgeMax === '' ? Infinity : parseInt(filterAgeMax);
      const matchYears = serviceAge >= minAge && serviceAge <= maxAge;

      const matchSearch = v.plate_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.engine_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchDept && matchType && matchYears && matchSearch;
    });
  }, [vehicles, filterDept, filterType, filterStatus, filterAgeMin, filterAgeMax, searchTerm]);

  // Derived Data: Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const total = filteredVehicles.length;
    const active = filteredVehicles.filter(v => v.condition_status === 'Active').length;
    const maintenance = filteredVehicles.filter(v => v.condition_status === 'Maintenance').length;
    const disposal = filteredVehicles.filter(v => v.condition_status === 'Disposal').length;
    const totalValue = filteredVehicles.reduce((sum, v) => sum + v.asset_value, 0);
    return {
      totalCount: total,
      activeCount: active,
      maintenanceCount: maintenance,
      disposalCount: disposal,
      totalValue,
      utilizationRate: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [filteredVehicles]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'ใช้การได้': 0,
      'ชำรุด': 0,
      'รอจำหน่าย': 0
    };
    filteredVehicles.forEach(v => {
      const label = v.condition_status === 'Active' ? 'ใช้การได้' : 
                    v.condition_status === 'Maintenance' ? 'ชำรุด' : 'รอจำหน่าย';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredVehicles]);

  const ageData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const groups = {
        'ไม่เกิน 5 ปี': 0,
        '6-10 ปี': 0,
        '11-15 ปี': 0,
        '16 ปีขึ้นไป': 0
    };
    
    filteredVehicles.forEach(v => {
      const vYear = v.purchase_year || currentYear;
      const normalizedVYear = vYear > 2400 ? vYear - 543 : vYear;
      const age = currentYear - normalizedVYear;

      if (age <= 5) {
          groups['ไม่เกิน 5 ปี']++;
      } else if (age <= 10) {
          groups['6-10 ปี']++;
      } else if (age <= 15) {
          groups['11-15 ปี']++;
      } else {
          groups['16 ปีขึ้นไป']++;
      }
    });
    
    // Convert to array and filter out zero values to keep chart clean (optional, keeping all ensures consistent legend)
    return [
        { name: 'ไม่เกิน 5 ปี', value: groups['ไม่เกิน 5 ปี'] },
        { name: '6-10 ปี', value: groups['6-10 ปี'] },
        { name: '11-15 ปี', value: groups['11-15 ปี'] },
        { name: '16 ปีขึ้นไป', value: groups['16 ปีขึ้นไป'] }
    ];
  }, [filteredVehicles]);

  const departmentData = useMemo(() => {
    const deptMap: Record<string, { name: string, 'ใช้การได้': number, 'ชำรุด': number, 'รอจำหน่าย': number }> = {};
    
    filteredVehicles.forEach(v => {
      if (!deptMap[v.department]) {
        deptMap[v.department] = { name: v.department, 'ใช้การได้': 0, 'ชำรุด': 0, 'รอจำหน่าย': 0 };
      }
      const statusLabel = v.condition_status === 'Active' ? 'ใช้การได้' : 
                          v.condition_status === 'Maintenance' ? 'ชำรุด' : 'รอจำหน่าย';
      deptMap[v.department][statusLabel]++;
    });
    
    return Object.values(deptMap);
  }, [filteredVehicles]);

  const uniqueDepartments = useMemo(() => Array.from(new Set(vehicles.map(v => v.department))), [vehicles]);
  const uniqueTypes = useMemo(() => Array.from(new Set(vehicles.map(v => v.vehicle_type))), [vehicles]);

  // Handlers
  const handleAiRefresh = useCallback(async () => {
    setIsAiLoading(true);
    const result = await generateFleetInsight(filteredVehicles);
    setInsight(result);
    setIsAiLoading(false);
  }, [filteredVehicles]);

  const handleUpload = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    clearAllFilters(); // Reset filters so new data is visible immediately
    setCurrentView('dashboard'); // Switch to dashboard to show result
  };

  // Interactive Filter Handlers
  const handleAgeFilter = (ageLabel: string) => {
    // Logic to set min/max based on the group label
    if (ageLabel === 'ไม่เกิน 5 ปี') { setFilterAgeMin('0'); setFilterAgeMax('5'); }
    else if (ageLabel === '6-10 ปี') { setFilterAgeMin('6'); setFilterAgeMax('10'); }
    else if (ageLabel === '11-15 ปี') { setFilterAgeMin('11'); setFilterAgeMax('15'); }
    else if (ageLabel === '16 ปีขึ้นไป') { setFilterAgeMin('16'); setFilterAgeMax('100'); }
  };

  const handleStatusFilter = (statusLabel: string) => {
    setFilterStatus(statusLabel);
  };

  const handleDeptFilter = (deptName: string) => {
    setFilterDept(deptName);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ease-in-out relative ${styles.bgClass} ${styles.font}`}>
      {/* Background Overlays omitted for brevity - same as original */}

      {/* Navbar */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-[24px] border-b border-white/10
          ${isInnovation ? 'glass-prism bg-black/40 border-innovation-primary/20' : 
            isOcean ? 'bg-black/50' :
            isTactical ? 'bg-black/50' :
            isExecutive ? 'bg-white/5' :
            isColorful ? 'bg-black/40' : 'bg-white/90 shadow-sm'}`}
      >
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12
               ${isTactical ? 'bg-ops-green text-black' : 
                 isExecutive ? 'bg-exec-gold text-black' :
                 isInnovation ? 'bg-gradient-to-tr from-innovation-primary to-innovation-secondary text-white shadow-innovation-primary/50' : 
                 isOcean ? 'bg-ocean-neon text-black' :
                 isColorful ? 'bg-gradient-to-tr from-[#ff0080] to-[#7928ca] text-white' :
                 'bg-blue-600 text-white'}`}>
                <i className="fas fa-shield-alt text-xl"></i>
             </div>
             <div>
               <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${styles.textClass}`}>
                 Border Patrol <span className={styles.primaryText}>Police Bureau</span>
               </h1>
               <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${styles.secondaryText}`}>
                 Intelligent vehicle management system
               </p>
             </div>
          </div>

          <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${isInnovation ? 'text-innovation-secondary' : styles.textClass}`}>
            {[
              { id: 'dashboard', label: 'หน้าหลัก' },
              { id: 'analytics', label: 'วิเคราะห์ข้อมูล' },
              { id: 'assets', label: 'ทะเบียนรถ' },
              { id: 'settings', label: 'ตั้งค่า' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setCurrentView(item.id as any)}
                className={`transition-all border-b-2 border-transparent pb-1
                  ${currentView === item.id 
                    ? (isColorful ? 'text-[#ff0080] border-[#ff0080] font-black' 
                       : isInnovation ? 'text-innovation-neon border-innovation-primary font-bold drop-shadow-md'
                       : 'text-white border-white font-bold') 
                    : 'opacity-60 hover:opacity-100'}
                `} 
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex p-1 rounded-full border border-white/10 bg-white/5`}>
               {[
                 { t: ThemeType.EXECUTIVE, l: '3D' }, 
                 { t: ThemeType.OFFICIAL, l: 'CLR' }, 
                 { t: ThemeType.TACTICAL, l: 'OPS' },
                 { t: ThemeType.INNOVATION, l: 'AI' },
                 { t: ThemeType.OCEAN, l: 'SEA' }
                ].map((opt) => (
                 <button 
                    key={opt.t}
                    onClick={() => setTheme(opt.t)} 
                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all
                      ${theme === opt.t 
                        ? (isColorful ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white' : isInnovation ? 'bg-gradient-to-r from-innovation-primary to-innovation-secondary text-white shadow-lg' : 'bg-blue-600 text-white shadow-md') 
                        : 'text-white/60 hover:text-white'}
                    `}
                  >
                   {opt.l}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 relative z-10">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
               <div className="flex items-center gap-4">
                 <div>
                    <div className={`text-sm font-medium mb-1 ${styles.secondaryText}`}>
                      <i className="fas fa-calendar-alt mr-2"></i>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}
                    </div>
                    <h2 className={`text-2xl font-bold ${styles.textClass} drop-shadow-md`}>
                      ภาพรวมสถานภาพ <span className="opacity-70 font-light">| งานยานพาหนะและขนส่ง</span>
                    </h2>
                 </div>
                 {isAnyFilterActive && (
                    <button 
                        onClick={clearAllFilters}
                        className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                        <i className="fas fa-filter-circle-xmark"></i> ล้างตัวกรองทั้งหมด
                    </button>
                 )}
               </div>
               
               {/* Quick Dropdown Filters */}
               <div className="flex flex-wrap gap-2">
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className={`bg-white/5 border border-white/10 rounded-lg text-xs p-2 outline-none ${styles.textClass}`}>
                    <option value="All">ทุกแผนก</option>
                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`bg-white/5 border border-white/10 rounded-lg text-xs p-2 outline-none ${styles.textClass}`}>
                    <option value="All">ทุกสถานะ</option>
                    <option value="Active">ใช้การได้</option>
                    <option value="Maintenance">ชำรุด</option>
                    <option value="Disposal">รอจำหน่าย</option>
                  </select>
               </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard theme={theme} title="จำนวนรถทั้งหมด" value={metrics.totalCount} icon="fa-truck" trend="+2" trendUp={true} />
              <KpiCard theme={theme} title="อัตราความพร้อม" value={`${metrics.utilizationRate}%`} icon="fa-chart-line" trend="-5%" trendUp={false} />
              <KpiCard theme={theme} title="มูลค่าทรัพย์สินรวม" value={metrics.totalValue} icon="fa-coins" isCurrency={true} />
              <div className={`${styles.cardClass} p-4 flex flex-col justify-center gap-2`}>
                 <h4 className={`text-xs font-bold uppercase tracking-widest opacity-80 ${styles.textClass}`}>สรุปสถานภาพ</h4>
                 <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-1">
                    <span className="text-green-400">ใช้การได้</span>
                    <span className={styles.primaryText}>{metrics.activeCount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-1">
                    <span className="text-yellow-400">ชำรุด</span>
                    <span className={styles.primaryText}>{metrics.maintenanceCount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-red-400">รอจำหน่าย</span>
                    <span className={styles.primaryText}>{metrics.disposalCount}</span>
                 </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 flex flex-col gap-6">
                 {/* 1. สัดส่วนอายุการใช้งาน (Interactive) */}
                 <div className={`${styles.cardClass} p-6 h-[480px] flex flex-col transition-all hover:border-current/30`}>
                    <h3 className={`${styles.primaryText} font-bold text-center mb-2 uppercase tracking-widest`}>
                        <i className="fas fa-history mr-2"></i>
                        สัดส่วนอายุการใช้งาน
                    </h3>
                    <div className="flex-1">
                        <AgePieChart data={ageData} theme={theme} onFilter={handleAgeFilter} />
                    </div>
                    <p className="text-[10px] text-center opacity-50 italic">คลิกที่ส่วนของวงกลมเพื่อกรองตามอายุ</p>
                 </div>

                 {/* 3. สัดส่วนสถานภาพ (Interactive) */}
                 <div className={`${styles.cardClass} p-6 h-[600px] flex flex-col transition-all hover:border-current/30`}>
                    <h3 className={`${styles.primaryText} font-bold text-center mb-6 uppercase tracking-widest`}>สัดส่วนสถานภาพ</h3>
                    <div className="flex-1">
                        <StatusDonutChart data={statusData} theme={theme} onFilter={handleStatusFilter} />
                    </div>
                    <p className="text-[10px] text-center opacity-50 italic">คลิกที่สถานะเพื่อกรอง</p>
                 </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-6">
                 {/* 2. สถานภาพตามหน่วยงาน (Interactive) */}
                 <div className={`${styles.cardClass} p-6 h-[480px] transition-all hover:border-current/30`}>
                    <h3 className={`${styles.primaryText} font-bold mb-4 uppercase tracking-wider`}>สถานภาพตามหน่วยงาน</h3>
                    <DepartmentBarChart data={departmentData} theme={theme} onFilter={handleDeptFilter} />
                    <p className="text-[10px] text-center opacity-50 italic">คลิกที่แท่งเพื่อกรองตามหน่วยงาน</p>
                 </div>

                 {/* 4. รายการยานพาหนะ (Filtered Display) */}
                 <div className={`${styles.cardClass} overflow-hidden h-[600px] flex flex-col shadow-2xl`}>
                    <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center">
                       <h3 className={`${styles.primaryText} font-bold uppercase tracking-wide`}>รายการยานพาหนะ</h3>
                       <span className="text-[10px] opacity-60">แสดง {filteredVehicles.length} จาก {vehicles.length} รายการ</span>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                       <table className="w-full text-left text-sm">
                          <thead className={`uppercase text-[10px] font-black sticky top-0 backdrop-blur-md z-10 border-b border-white/10 ${isExecutive ? 'bg-[#0a0a1a]' : 'bg-black/80'} text-white`}>
                            <tr>
                               <th className="px-6 py-4">สังกัด</th>
                               <th className="px-6 py-4">ประเภท/ยี่ห้อ</th>
                               <th className="px-6 py-4">หมายเลขทะเบียน</th>
                               <th className="px-6 py-4 text-right">มูลค่า (บาท)</th>
                               <th className="px-6 py-4">สถานภาพ</th>
                            </tr>
                          </thead>
                          <tbody className={`${styles.textClass} text-xs font-medium`}>
                             {filteredVehicles.map((v, i) => (
                               <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 font-bold">{v.department}</td>
                                  <td className="px-6 py-4">{v.vehicle_type} ({v.brand})</td>
                                  <td className={`px-6 py-4 font-black ${styles.primaryText}`}>{v.plate_no}</td>
                                  <td className="px-6 py-4 text-right">{v.asset_value.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.condition_status === 'Active' ? 'bg-green-500/20 text-green-400' : v.condition_status === 'Maintenance' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {v.condition_status === 'Active' ? 'ใช้การได้' : v.condition_status === 'Maintenance' ? 'ชำรุด' : 'รอจำหน่าย'}
                                     </span>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                       {filteredVehicles.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic p-10 text-center">
                              <i className="fas fa-search-minus text-4xl mb-4"></i>
                              ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && <AnalyticsView vehicles={filteredVehicles} theme={theme} />}
        {currentView === 'assets' && <AssetsView vehicles={vehicles} theme={theme} onUploadClick={() => setShowUploadModal(true)} />}
        {currentView === 'settings' && <div className="p-20 text-center opacity-30 text-white text-3xl font-black italic">Settings Development In-Progress</div>}
      </main>

      <AiBot vehicles={vehicles} theme={theme} />
      <FileUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleUpload} theme={theme} />
    </div>
  );
};

export default App;
