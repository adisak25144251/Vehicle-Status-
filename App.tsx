import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_VEHICLES, THEME_CONFIG } from './constants';
import { Vehicle, ThemeType, DashboardMetrics } from './types';
import { KpiCard } from './components/KpiCard';
import { StatusDonutChart, DepartmentBarChart } from './components/Charts';
import { AiInsight } from './components/AiInsight';
import { AiBot } from './components/AiBot';
import { AnalyticsView } from './components/AnalyticsView';
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

  const [theme, setTheme] = useState<ThemeType>(ThemeType.OCEAN);
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

  // Derived Data: Filtering Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const currentYear = new Date().getFullYear();
      const serviceAge = v.purchase_year ? currentYear - v.purchase_year : 0;

      const matchDept = filterDept === 'All' || v.department === filterDept;
      const matchType = filterType === 'All' || v.vehicle_type === filterType;
      const matchStatus = filterStatus === 'All' || v.condition_status === filterStatus;
      
      const minAge = filterAgeMin === '' ? 0 : parseInt(filterAgeMin);
      const maxAge = filterAgeMax === '' ? Infinity : parseInt(filterAgeMax);
      const matchYears = serviceAge >= minAge && serviceAge <= maxAge;

      const matchSearch = v.plate_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.engine_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchDept && matchType && matchStatus && matchYears && matchSearch;
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
    if (isInnovation) setInsight("กำลังวิเคราะห์ข้อมูลเชิงลึก...");
    else if (isOcean) setInsight("Initiating Cyber-Sea Intelligence Link...");
    else if (isTactical) setInsight("Establishing Green Operations Uplink...");
    else if (isExecutive) setInsight("Analyzing premium assets...");
    else setInsight("Processing fleet data...");
    
    const result = await generateFleetInsight(filteredVehicles);
    setInsight(result);
    setIsAiLoading(false);
  }, [filteredVehicles, isInnovation, isOcean, isTactical, isExecutive]);

  const handleUpload = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ease-in-out relative ${styles.bgClass} ${styles.font}`}>
      
      {/* Background Effects */}
      {isInnovation && (
        <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      )}

      {isOcean && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-50px] left-[15%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-[-100px] right-[5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-[30%] left-[45%] w-[300px] h-[300px] bg-ocean-neon/10 rounded-full mix-blend-overlay filter blur-2xl animate-pulse-neon"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
      )}

      {isTactical && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-ops-green/10 rounded-full filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full filter blur-[120px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
      )}

      {isExecutive && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] bg-exec-gold/5 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-amber-900/10 rounded-full filter blur-[150px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,176,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,176,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>
      )}

      {/* Navbar */}
      <nav 
        data-testid="nav-container"
        className={`sticky top-0 z-50 transition-all duration-300 
          ${isInnovation ? 'glass-prism bg-white/60 border-b border-white/20' : 
            isOcean ? 'bg-black/50 backdrop-blur-xl border-b border-ocean-neon/30 shadow-[0_4px_20px_rgba(0,243,255,0.1)]' :
            isTactical ? 'bg-black/50 backdrop-blur-xl border-b border-ops-green/30 shadow-[0_4px_20px_rgba(57,255,20,0.1)]' :
            isExecutive ? 'bg-black/70 backdrop-blur-xl border-b border-exec-gold/30 shadow-[0_4px_20px_rgba(255,176,0,0.1)]' :
            theme === ThemeType.OFFICIAL ? 'bg-white/90 shadow-sm' : 
            'bg-black/20 backdrop-blur-md border-b border-white/5'}`}
      >
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12
               ${isTactical ? 'bg-ops-green/20 text-ops-green border border-ops-green/50 shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 
                 isExecutive ? 'bg-exec-gold/20 text-exec-gold border border-exec-gold/50' :
                 isInnovation ? 'bg-gradient-to-br from-blue-50 to-purple-600 text-white' : 
                 isOcean ? 'bg-ocean-neon/20 text-ocean-neon backdrop-blur-sm border border-ocean-neon/50 shadow-[0_0_10px_rgba(0,243,255,0.3)]' :
                 'bg-blue-600 text-white'}`}>
                <i className="fas fa-shield-alt text-xl"></i>
             </div>
             <div>
               <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${styles.textClass}`}>
                 Border Patrol <span className={isInnovation ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' : isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : styles.primaryText}>Police Bureau</span>
               </h1>
               <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${styles.secondaryText}`}>
                 {isInnovation ? 'ระบบบริหารจัดการยานพาหนะอัจฉริยะ' : isOcean ? 'CYBER NEON FLEET COMMAND' : isTactical ? 'GREEN NEON OPERATIONS' : isExecutive ? 'EXECUTIVE ASSET DASHBOARD' : 'Operational Readiness'}
               </p>
             </div>
          </div>

          <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${isInnovation ? 'text-gray-600' : styles.textClass}`}>
            {[
              { id: 'dashboard', label: 'หน้าหลัก' },
              { id: 'analytics', label: 'วิเคราะห์ข้อมูล' },
              { id: 'assets', label: 'ทะเบียนรถ' },
              { id: 'settings', label: 'ตั้งค่า' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setCurrentView(item.id as any)}
                className={`transition-colors border-b-2 border-transparent hover:${isInnovation ? 'text-blue-600 border-blue-600' : isOcean ? 'text-ocean-neon border-ocean-neon drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' : isTactical ? 'text-ops-green border-ops-green drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]' : isExecutive ? 'text-exec-gold border-exec-gold drop-shadow-[0_0_5px_rgba(255,176,0,0.8)]' : 'text-white border-white'}
                  ${currentView === item.id ? (isInnovation ? 'text-blue-600 border-blue-600 font-bold' : isOcean ? 'text-ocean-neon border-ocean-neon font-bold shadow-[0_0_10px_rgba(0,243,255,0.4)]' : isTactical ? 'text-ops-green border-ops-green font-bold shadow-[0_0_10px_rgba(57,255,20,0.4)]' : isExecutive ? 'text-exec-gold border-exec-gold font-bold shadow-[0_0_10px_rgba(255,176,0,0.4)]' : 'text-white border-white font-bold') : 'opacity-80 hover:opacity-100'}
                `} 
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex p-1 rounded-full border ${theme === ThemeType.OFFICIAL ? 'border-gray-200 bg-gray-50' : isInnovation || isOcean || isTactical || isExecutive ? 'border-white/10 bg-white/5 backdrop-blur-md' : 'border-gray-700 bg-black/20'}`}>
               {[
                 { t: ThemeType.EXECUTIVE, l: 'EXEC' }, 
                 { t: ThemeType.OFFICIAL, l: 'GOV' }, 
                 { t: ThemeType.TACTICAL, l: 'OPS' },
                 { t: ThemeType.INNOVATION, l: 'AI' },
                 { t: ThemeType.OCEAN, l: 'SEA' }
                ].map((opt) => (
                 <button 
                    key={opt.t}
                    onClick={() => setTheme(opt.t)} 
                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all duration-300
                      ${theme === opt.t 
                        ? (isInnovation ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : isOcean ? 'bg-ocean-neon text-black shadow-[0_0_10px_rgba(0,243,255,0.8)]' : isTactical ? 'bg-ops-green text-black shadow-[0_0_10px_rgba(57,255,20,0.8)]' : isExecutive ? 'bg-exec-gold text-black shadow-[0_0_10px_rgba(255,176,0,0.8)]' : 'bg-blue-600 text-white') 
                        : (isInnovation ? 'text-gray-400 hover:text-gray-600' : isOcean ? 'text-ocean-neon/60 hover:text-ocean-neon' : isTactical ? 'text-ops-green/60 hover:text-ops-green' : isExecutive ? 'text-exec-gold/60 hover:text-exec-gold' : 'text-gray-500 hover:text-gray-300')}
                    `}
                  >
                   {opt.l}
                 </button>
               ))}
            </div>
            
            <div className={`relative transition-all duration-300 ${searchFocused && (isInnovation || isOcean || isTactical || isExecutive) ? 'scale-110 z-50' : ''}`}>
               <i className={`fas fa-search absolute left-3 top-2.5 transition-colors ${searchFocused ? 'text-blue-500' : isOcean ? 'text-ocean-neon opacity-80' : isTactical ? 'text-ops-green opacity-80' : isExecutive ? 'text-exec-gold opacity-80' : 'opacity-50 ' + styles.textClass}`}></i>
               <input 
                  type="text" 
                  placeholder="ค้นหา ทะเบียน/โล่..." 
                  className={`pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none w-48 transition-all duration-300
                    ${isInnovation 
                      ? 'bg-white/80 border border-gray-200 focus:w-64 focus:shadow-lg focus:border-blue-400 text-gray-800 placeholder-gray-400' 
                      : isOcean 
                      ? 'bg-ocean-neon/10 border border-ocean-neon/30 text-ocean-neon placeholder-ocean-neon/40 focus:w-64 focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] focus:bg-ocean-neon/20'
                      : isTactical
                      ? 'bg-ops-green/10 border border-ops-green/30 text-ops-green placeholder-ops-green/50 focus:w-64 focus:shadow-[0_0_15px_rgba(57,255,20,0.3)] focus:bg-ops-green/20'
                      : isExecutive
                      ? 'bg-exec-gold/10 border border-exec-gold/30 text-exec-gold placeholder-exec-gold/50 focus:w-64 focus:shadow-[0_0_15px_rgba(255,176,0,0.3)] focus:bg-exec-gold/20'
                      : theme === ThemeType.OFFICIAL ? 'bg-gray-100 text-black border border-gray-300' : 'bg-white/10 text-white border border-white/10'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
               />
            </div>
          </div>
        </div>
      </nav>

      {/* Focus Overlay */}
      {searchFocused && (isInnovation || isOcean || isTactical || isExecutive) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"></div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        
        {/* Top Bar: Title & Filters (Only show on Dashboard) */}
        {currentView === 'dashboard' && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6 animate-slide-up">
           <div>
             <div className={`text-sm font-medium mb-1 ${isInnovation ? 'text-indigo-600' : isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : 'text-gray-400'}`}>
               {isInnovation || isOcean || isTactical || isExecutive ? <><i className="fas fa-calendar-alt mr-2"></i>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</> : 'Overview'}
             </div>
             <h2 className={`text-2xl font-bold ${styles.textClass} drop-shadow-md`}>
               ภาพรวมสถานภาพ <span className="opacity-70 font-light">| งานยานพาหนะและขนส่ง</span>
             </h2>
           </div>

           {/* Filter Bar */}
           <div className={`flex flex-wrap items-center gap-3 p-3 rounded-2xl ${isInnovation ? 'bg-white/40 border border-white/50 backdrop-blur-md shadow-sm' : isOcean ? 'bg-ocean-neon/5 border border-ocean-neon/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.1)]' : isTactical ? 'bg-ops-green/5 border border-ops-green/30 backdrop-blur-md shadow-[0_0_15px_rgba(57,255,20,0.1)]' : isExecutive ? 'bg-exec-gold/5 border border-exec-gold/30 backdrop-blur-md shadow-[0_0_15px_rgba(255,176,0,0.1)]' : ''}`}>
              <button 
                type="button"
                onClick={() => setShowUploadModal(true)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer z-20 relative
                  ${isInnovation ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' : isOcean ? 'bg-ocean-neon text-black hover:bg-white shadow-[0_0_10px_rgba(0,243,255,0.6)]' : isTactical ? 'bg-ops-green text-black hover:bg-ops-green/90 shadow-[0_0_10px_rgba(57,255,20,0.6)]' : isExecutive ? 'bg-exec-gold text-black hover:bg-exec-gold/90 shadow-[0_0_10px_rgba(255,176,0,0.6)]' : 'bg-green-600 text-white'}`}
              >
                <i className="fas fa-file-import"></i> อัปเดตข้อมูล
              </button>

              <select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer outline-none ${isInnovation ? 'bg-white border border-gray-200 text-gray-700' : isOcean ? 'bg-black/40 border border-ocean-neon/30 text-ocean-neon font-mono' : isTactical ? 'bg-black/40 border border-ops-green/30 text-ops-green font-mono' : isExecutive ? 'bg-black/40 border border-exec-gold/30 text-exec-gold' : 'bg-white/10 text-white border-white/10 border'} [&>option]:text-black`}
              >
                 <option value="All">ทุกหน่วยงาน</option>
                 {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer outline-none ${isInnovation ? 'bg-white border border-gray-200 text-gray-700' : isOcean ? 'bg-black/40 border border-ocean-neon/30 text-ocean-neon font-mono' : isTactical ? 'bg-black/40 border border-ops-green/30 text-ops-green font-mono' : isExecutive ? 'bg-black/40 border border-exec-gold/30 text-exec-gold' : 'bg-white/10 text-white border-white/10 border'} [&>option]:text-black`}
              >
                 <option value="All">ทุกประเภทระถ</option>
                 {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer outline-none ${isInnovation ? 'bg-white border border-gray-200 text-gray-700' : isOcean ? 'bg-black/40 border border-ocean-neon/30 text-ocean-neon font-mono' : isTactical ? 'bg-black/40 border border-ops-green/30 text-ops-green font-mono' : isExecutive ? 'bg-black/40 border border-exec-gold/30 text-exec-gold' : 'bg-white/10 text-white border-white/10 border'} [&>option]:text-black`}
              >
                 <option value="All">ทุกสถานภาพ</option>
                 <option value="Active">ใช้การได้</option>
                 <option value="Maintenance">ชำรุด</option>
                 <option value="Disposal">รอจำหน่าย</option>
              </select>
              
              {/* Service Age Range Filter */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isInnovation ? 'bg-white border-gray-200' : isOcean ? 'bg-black/40 border-ocean-neon/30 text-ocean-neon' : isTactical ? 'bg-black/40 border-ops-green/30 text-ops-green' : isExecutive ? 'bg-black/40 border-exec-gold/30 text-exec-gold' : 'bg-white/10 border-white/10'}`}>
                <span className="text-xs font-bold whitespace-nowrap opacity-70">อายุการใช้งาน</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] opacity-60">ระหว่าง</span>
                  <input 
                      type="number"
                      placeholder="0"
                      value={filterAgeMin}
                      onChange={(e) => setFilterAgeMin(e.target.value)}
                      className="w-12 bg-transparent text-center text-sm outline-none font-bold border-b border-white/20 focus:border-white/50"
                  />
                  <span className="text-[10px] opacity-60">ถึง</span>
                  <input 
                      type="number"
                      placeholder="99"
                      value={filterAgeMax}
                      onChange={(e) => setFilterAgeMax(e.target.value)}
                      className="w-12 bg-transparent text-center text-sm outline-none font-bold border-b border-white/20 focus:border-white/50"
                  />
                  <span className="text-xs opacity-70">ปี</span>
                </div>
              </div>
           </div>
        </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <>
            {/* Main KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <KpiCard theme={theme} title="จำนวนรถทั้งหมด" value={metrics.totalCount} icon="fa-truck" trend="+2" trendUp={true} />
              <KpiCard theme={theme} title="อัตราความพร้อม" value={`${metrics.utilizationRate}%`} icon="fa-chart-line" trend={metrics.utilizationRate < 80 ? "-5%" : "+1%"} trendUp={metrics.utilizationRate >= 80} />
              <KpiCard theme={theme} title="มูลค่าทรัพย์สินรวม" value={metrics.totalValue} icon="fa-coins" isCurrency={true} />
              <div className={`${styles.cardClass} p-4 flex flex-col justify-center gap-2 relative overflow-hidden group`}>
                 {isOcean && <div className="absolute inset-0 bg-ocean-neon/5 group-hover:bg-ocean-neon/10 transition-colors duration-500"></div>}
                 {isTactical && <div className="absolute inset-0 bg-ops-green/5 group-hover:bg-ops-green/10 transition-colors duration-500"></div>}
                 {isExecutive && <div className="absolute inset-0 bg-exec-gold/5 group-hover:bg-exec-gold/10 transition-colors duration-500"></div>}
                 
                 <h4 className={`text-xs font-bold uppercase tracking-widest opacity-80 ${styles.textClass} z-10`}>สรุปสถานภาพ</h4>
                 
                 <div className="z-10 flex flex-col gap-2">
                    <div className={`flex justify-between items-center border-b pb-2 ${isOcean ? 'border-ocean-neon/10' : isTactical ? 'border-ops-green/20' : isExecutive ? 'border-exec-gold/20' : 'border-gray-200/10'}`}>
                        <div className="flex items-center">
                             <div className={`w-2 h-2 rounded-full mr-2 ${isOcean ? 'bg-ocean-neon shadow-[0_0_5px_#00F3FF]' : isTactical ? 'bg-ops-green shadow-[0_0_5px_#39FF14]' : isExecutive ? 'bg-exec-gold shadow-[0_0_5px_#FFB000]' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'}`}></div>
                             <span className={`${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : 'text-green-500'} text-sm font-bold`}>ใช้การได้</span>
                        </div>
                        <span className={`text-xl font-bold ${styles.primaryText} drop-shadow-sm`}>{metrics.activeCount.toLocaleString()}</span>
                    </div>

                    <div className={`flex justify-between items-center border-b pb-2 ${isOcean ? 'border-ocean-neon/10' : isTactical ? 'border-ops-green/20' : isExecutive ? 'border-exec-gold/20' : 'border-gray-200/10'}`}>
                         <div className="flex items-center">
                             <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                             <span className={`${isOcean ? 'text-yellow-400' : isTactical ? 'text-yellow-400' : isExecutive ? 'text-yellow-400' : 'text-yellow-500'} text-sm font-bold`}>ชำรุด</span>
                        </div>
                        <span className={`text-xl font-bold ${styles.primaryText} drop-shadow-sm`}>{metrics.maintenanceCount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                         <div className="flex items-center">
                             <div className="w-2 h-2 rounded-full bg-red-400 mr-2 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></div>
                             <span className={`${isOcean ? 'text-red-400' : isTactical ? 'text-red-400' : isExecutive ? 'text-red-400' : 'text-red-500'} text-sm font-bold`}>รอจำหน่าย</span>
                        </div>
                        <span className={`text-xl font-bold ${styles.primaryText} drop-shadow-sm`}>{metrics.disposalCount.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* AI & Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1 flex flex-col gap-6">
                 <AiInsight theme={theme} insight={insight} loading={isAiLoading} onRefresh={handleAiRefresh} />
                 
                 <div className={`${styles.cardClass} p-6 h-[600px] flex flex-col items-center justify-center`}>
                    {/* Centered Styled Title */}
                    <div className="w-full flex items-center justify-center gap-4 mb-6">
                      <div className={`h-[1px] flex-1 ${isTactical ? 'bg-ops-green/30' : isOcean ? 'bg-ocean-neon/30' : isExecutive ? 'bg-exec-gold/30' : 'bg-gray-200'}`}></div>
                      <h3 className={`${styles.primaryText} font-bold text-center drop-shadow-sm whitespace-nowrap`}>
                        สัดส่วนสถานภาพ
                      </h3>
                      <div className={`h-[1px] flex-1 ${isTactical ? 'bg-ops-green/30' : isOcean ? 'bg-ocean-neon/30' : isExecutive ? 'bg-exec-gold/30' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center">
                        <StatusDonutChart data={statusData} theme={theme} />
                    </div>
                 </div>
              </div>
              
              <div className="lg:col-span-2 flex flex-col gap-6">
                 <div className={`${styles.cardClass} p-6 h-[480px]`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`${styles.primaryText} font-bold drop-shadow-sm`}>สถานภาพตามหน่วยงาน</h3>
                    </div>
                    <DepartmentBarChart data={departmentData} theme={theme} />
                 </div>

                 {/* Vehicle Table */}
                 <div className={`${styles.cardClass} overflow-hidden h-[600px] flex flex-col`}>
                    <div className={`p-4 border-b shrink-0 ${isInnovation ? 'border-gray-100' : isOcean ? 'border-ocean-neon/30' : isTactical ? 'border-ops-green/30' : isExecutive ? 'border-exec-gold/30' : 'border-white/10'}`}>
                       <h3 className={`${styles.primaryText} font-bold drop-shadow-sm`}>รายการยานพาหนะ</h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                       <table className="w-full text-left text-sm">
                          <thead className={`uppercase text-xs sticky top-0 backdrop-blur-md z-10
                            ${isInnovation ? 'bg-white/90 text-gray-500' : isOcean ? 'bg-black/80 text-ocean-neon font-bold border-b border-ocean-neon/30' : isTactical ? 'bg-black/80 text-ops-green font-bold border-b border-ops-green/30' : isExecutive ? 'bg-black/80 text-exec-gold font-bold border-b border-exec-gold/30' : theme === ThemeType.OFFICIAL ? 'bg-gray-100 text-gray-600' : 'bg-black/40 text-gray-400'}`}>
                            <tr>
                               <th className="px-4 py-4 text-center">ลำดับ</th>
                               <th className="px-6 py-4">หน่วยงาน</th>
                               <th className="px-6 py-4">ประเภทยานพาหนะ</th>
                               <th className="px-6 py-4">หมายเลขทะเบียน</th>
                               <th className="px-6 py-4 text-right">ราคา (บาท)</th>
                               <th className="px-6 py-4 text-center">วันที่ได้มา</th>
                               <th className="px-6 py-4 text-center">อายุการใช้งาน</th>
                               <th className="px-6 py-4">สถานภาพ</th>
                            </tr>
                          </thead>
                          <tbody className={`${styles.textClass} text-sm`}>
                             {filteredVehicles.map((v, i) => {
                               const age = new Date().getFullYear() - (v.purchase_year || 2020);
                               return (
                               <tr key={i} className={`border-b transition-colors duration-200
                                 ${isInnovation ? 'border-gray-50 hover:bg-blue-50/50' : isOcean ? 'border-ocean-neon/10 hover:bg-ocean-neon/5' : isTactical ? 'border-ops-green/10 hover:bg-ops-green/5' : isExecutive ? 'border-exec-gold/10 hover:bg-exec-gold/5' : theme === ThemeType.OFFICIAL ? 'border-gray-100 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5'}`}>
                                  <td className="px-4 py-4 text-center font-bold opacity-70">{i + 1}</td>
                                  <td className="px-6 py-4 font-bold">{v.department}</td>
                                  <td className="px-6 py-4">{v.vehicle_type} <span className="text-[10px] opacity-60 font-normal ml-1">({v.brand})</span></td>
                                  <td className={`px-6 py-4 font-bold font-sans ${isInnovation ? 'text-blue-600' : isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : ''}`}>{v.plate_no}</td>
                                  <td className="px-6 py-4 text-right font-bold">{v.asset_value.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">{v.purchase_year}</td>
                                  <td className="px-6 py-4 text-center font-bold text-orange-400">{age} ปี</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shadow-sm
                                       ${v.condition_status === 'Active' ? 'bg-green-100 text-green-700' : 
                                         v.condition_status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 
                                         'bg-red-100 text-red-700'}`}>
                                        <span className={`w-2 h-2 rounded-full ${v.condition_status === 'Active' ? 'bg-green-500' : v.condition_status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                        {v.condition_status === 'Active' ? 'ใช้การได้' : v.condition_status === 'Maintenance' ? 'ชำรุด' : 'รอจำหน่าย'}
                                     </span>
                                  </td>
                               </tr>
                             )})}
                          </tbody>
                       </table>
                       {filteredVehicles.length === 0 && (
                          <div className="p-12 text-center opacity-50">
                            <i className="fas fa-inbox text-4xl mb-3 block"></i>
                            ไม่พบข้อมูลยานพาหนะ
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}

        {/* Analytics View Integration */}
        {currentView === 'analytics' && (
            <AnalyticsView vehicles={filteredVehicles} theme={theme} />
        )}

        {/* Settings/Assets placeholders */}
        {(currentView === 'assets' || currentView === 'settings') && (
          <div className={`${styles.cardClass} p-12 text-center animate-slide-up`}>
              <i className="fas fa-tools text-6xl mb-4 opacity-20"></i>
              <h2 className={`text-2xl font-bold ${styles.primaryText}`}>ส่วนงาน {currentView}</h2>
              <p className="opacity-60 mt-2">กำลังอยู่ในระหว่างการพัฒนา</p>
          </div>
        )}

      </main>

      <AiBot vehicles={vehicles} theme={theme} />
      <FileUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleUpload} theme={theme} />

    </div>
  );
};

export default App;