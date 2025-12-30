import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ThemeType, Vehicle } from '../types';
import { THEME_CONFIG } from '../constants';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (newVehicles: Vehicle[]) => void;
  theme: ThemeType;
}

interface AnalysisLog {
  step: string;
  status: 'pending' | 'success' | 'error';
  details?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onUpload, theme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;

  if (!isOpen) return null;

  const addLog = (step: string, status: 'pending' | 'success' | 'error' = 'pending', details?: string) => {
    setLogs(prev => [...prev, { step, status, details }]);
  };

  const updateLastLog = (status: 'success' | 'error', details?: string) => {
    setLogs(prev => {
      const newLogs = [...prev];
      if (newLogs.length > 0) {
        newLogs[newLogs.length - 1] = { ...newLogs[newLogs.length - 1], status, details };
      }
      return newLogs;
    });
  };

  const mapStatus = (val: any): 'Active' | 'Maintenance' | 'Disposal' | 'Unknown' => {
      if (!val) return 'Unknown';
      const s = String(val).toLowerCase();
      if (s.includes('ดี') || s.includes('active') || s.includes('ใช้') || s.includes('ปกติ')) return 'Active';
      if (s.includes('ซ่อม') || s.includes('maint') || s.includes('ชำรุด')) return 'Maintenance';
      if (s.includes('จำหน่าย') || s.includes('disposal') || s.includes('ขาย') || s.includes('เสื่อม')) return 'Disposal';
      return 'Active'; // Default lenient
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setLogs([]);
    
    try {
        addLog("Reading file structure...");
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                updateLastLog('success', `Detected format: ${file.name.split('.').pop()?.toUpperCase()}`);
                
                addLog("Analyzing sheets...");
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                if (!sheet) {
                    throw new Error("No sheets found in file");
                }
                updateLastLog('success', `Processing sheet: ${sheetName}`);

                addLog("Scanning headers for fleet data...");
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error("Sheet appears empty or missing data rows");
                }

                // Smart Header Analysis
                const headers = jsonData[0] as string[];
                const map: Record<string, number> = {};
                const foundColumns: string[] = [];

                headers.forEach((h, index) => {
                    const text = String(h || '').toLowerCase().trim();
                    if (!text) return;

                    if (text.includes('ทะเบียน') || text.includes('plate') || text.includes('number')) { map['plate_no'] = index; foundColumns.push(`ทะเบียน (${h})`); }
                    else if (text.includes('ประเภท') || text.includes('type') || text.includes('kind')) { map['vehicle_type'] = index; foundColumns.push(`ประเภท (${h})`); }
                    else if (text.includes('ยี่ห้อ') || text.includes('brand') || text.includes('model')) { map['brand'] = index; foundColumns.push(`ยี่ห้อ (${h})`); }
                    else if (text.includes('เครื่อง') || text.includes('engine')) { map['engine_no'] = index; foundColumns.push(`เลขเครื่อง (${h})`); }
                    else if (text.includes('ราคา') || text.includes('value') || text.includes('price') || text.includes('cost')) { map['asset_value'] = index; foundColumns.push(`ราคา (${h})`); }
                    else if (text.includes('หน่วย') || text.includes('dept') || text.includes('unit') || text.includes('สังกัด')) { map['department'] = index; foundColumns.push(`หน่วยงาน (${h})`); }
                    else if (text.includes('สถานะ') || text.includes('status') || text.includes('สภาพ') || text.includes('condition')) { map['condition_status'] = index; foundColumns.push(`สถานะ (${h})`); }
                    else if (text.includes('ปี') || text.includes('year') || text.includes('date') || text.includes('ซื้อ')) { map['purchase_year'] = index; foundColumns.push(`ปีที่ซื้อ (${h})`); }
                });

                if (Object.keys(map).length < 3) {
                     updateLastLog('error', 'Low confidence match. Are headers correct?');
                     await new Promise(r => setTimeout(r, 1000));
                } else {
                     updateLastLog('success', `Mapped ${Object.keys(map).length} columns intelligently.`);
                }

                addLog(`Extracting vehicle records...`);
                // Simulate processing time for "Analysis" feel
                await new Promise(r => setTimeout(r, 800));

                const rows = jsonData.slice(1);
                const newVehicles: Vehicle[] = [];

                rows.forEach((row: any) => {
                    if (!row || row.length === 0) return;
                    
                    // Safe access helper
                    const getVal = (key: string) => row[map[key]];

                    const plate = getVal('plate_no');
                    if (plate) {
                        newVehicles.push({
                            plate_no: String(plate),
                            vehicle_type: String(getVal('vehicle_type') || "Unknown"),
                            brand: String(getVal('brand') || "Unknown"),
                            engine_no: String(getVal('engine_no') || "-"),
                            asset_value: Number(getVal('asset_value')) || 0,
                            department: String(getVal('department') || "Unassigned"),
                            condition_status: mapStatus(getVal('condition_status')),
                            purchase_year: Number(getVal('purchase_year')) || 2020
                        });
                    }
                });

                updateLastLog('success', `Found ${newVehicles.length} valid records.`);
                
                if (newVehicles.length > 0) {
                    addLog("Finalizing import...");
                    await new Promise(r => setTimeout(r, 500));
                    onUpload(newVehicles);
                    onClose();
                    alert(`Successfully imported ${newVehicles.length} vehicles.`);
                } else {
                    addLog("No valid data found.", 'error');
                }

            } catch (err) {
                console.error(err);
                updateLastLog('error', 'Failed to parse file content.');
            }
            setUploading(false);
        };
        reader.readAsBinaryString(file);

    } catch (error) {
        console.error(error);
        setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
      <div className={`
        w-full max-w-lg p-6 rounded-3xl relative transition-all overflow-hidden flex flex-col max-h-[90vh]
        ${isInnovation ? 'glass-prism bg-white shadow-2xl' : isOcean ? 'bg-[#000d1a]/95 backdrop-blur-2xl border border-ocean-neon/40 shadow-[0_0_40px_rgba(0,243,255,0.2)]' : isTactical ? 'bg-black/90 backdrop-blur-xl border border-ops-green/40 shadow-[0_0_40px_rgba(57,255,20,0.15)]' : styles.cardClass}
      `}>
        <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10 ${isInnovation ? 'text-gray-400 hover:text-gray-600' : 'text-white'}`}
        >
          <i className="fas fa-times"></i>
        </button>

        <h3 className={`text-xl font-bold mb-4 ${isInnovation ? 'text-gray-800' : isOcean ? 'text-ocean-neon drop-shadow-md' : isTactical ? 'text-ops-green drop-shadow-md' : 'text-white drop-shadow-md'}`}>
            <i className={`fas fa-robot mr-2 ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : 'text-blue-400'}`}></i> 
            Smart Data Import
        </h3>
        
        <p className={`text-sm mb-6 ${isInnovation ? 'text-gray-500' : isOcean ? 'text-ocean-neon/80 font-mono' : isTactical ? 'text-ops-green/80 font-mono' : 'text-white/70 font-medium'}`}>
          AI จะวิเคราะห์หัวตาราง (Headers) โดยอัตโนมัติ รองรับไฟล์ .xlsx
        </p>

        {uploading ? (
             <div className={`flex-1 flex flex-col rounded-2xl p-6 ${isOcean || isTactical ? 'bg-black/20' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-4">
                     <i className={`fas fa-circle-notch fa-spin text-2xl mr-3 ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : 'text-blue-400'}`}></i>
                     <span className={`font-bold ${isOcean || isTactical ? 'text-white' : 'text-gray-700'}`}>Analyzing Data Structure...</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {logs.map((log, idx) => (
                        <div key={idx} className={`text-xs flex items-center ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : 'text-gray-600'} animate-slide-up`}>
                            <span className={`w-4 mr-2 text-center`}>
                                {log.status === 'success' && <i className="fas fa-check text-green-400"></i>}
                                {log.status === 'error' && <i className="fas fa-times text-red-400"></i>}
                                {log.status === 'pending' && <div className={`w-1.5 h-1.5 rounded-full animate-pulse mx-auto ${isOcean ? 'bg-ocean-neon' : isTactical ? 'bg-ops-green' : 'bg-blue-400'}`}></div>}
                            </span>
                            <span className="flex-1">{log.step}</span>
                            {log.details && <span className="text-[10px] opacity-60 ml-2 italic">{log.details}</span>}
                        </div>
                    ))}
                </div>
             </div>
        ) : (
            <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={triggerFileInput}
            className={`
                border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer group
                ${isDragging 
                    ? 'border-blue-500 bg-blue-50/10' 
                    : isInnovation 
                        ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50' 
                        : isOcean 
                            ? 'border-ocean-neon/50 hover:border-ocean-neon hover:bg-ocean-neon/10 bg-black/40' 
                            : isTactical
                                ? 'border-ops-green/40 hover:border-ops-green hover:bg-ops-green/10 bg-black/40'
                            : 'border-gray-600 hover:border-gray-400 hover:bg-white/5'}
            `}
            >
                <div className="relative mb-4 group-hover:scale-110 transition-transform duration-500">
                    <i className={`fas fa-file-excel text-5xl ${isInnovation ? 'text-green-500' : isOcean ? 'text-ocean-neon drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]' : isTactical ? 'text-ops-green drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]' : 'text-gray-400'}`}></i>
                    <i className={`fas fa-search absolute -bottom-2 -right-2 text-xl bg-blue-600 rounded-full p-1 text-white border-2 border-blue-900`}></i>
                </div>
                
                <p className={`text-sm font-bold ${isInnovation ? 'text-gray-600' : 'text-white'}`}>
                    Drag & Drop Excel File Here
                </p>
                <p className={`text-xs mt-1 mb-4 ${isOcean ? 'text-ocean-neon/70' : isTactical ? 'text-ops-green/70' : 'text-gray-400'}`}>
                    (ระบบจะ mapping ชื่อคอลัมน์ให้อัตโนมัติ)
                </p>
                
                <button 
                    type="button"
                    className={`px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95
                        ${isInnovation ? 'bg-blue-600 text-white hover:bg-blue-700' : isOcean ? 'bg-ocean-neon text-black hover:bg-white shadow-[0_0_10px_rgba(0,243,255,0.6)]' : isTactical ? 'bg-ops-green text-black hover:bg-ops-green/90 shadow-[0_0_10px_rgba(57,255,20,0.6)]' : 'bg-gray-700 text-white hover:bg-gray-600'}
                    `}
                >
                    Select File
                </button>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".xlsx,.xls" 
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])} 
                />
            </div>
        )}
      </div>
    </div>
  );
};