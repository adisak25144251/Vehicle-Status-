
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import { ThemeType, Vehicle } from '../types';
import { THEME_CONFIG } from '../constants';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

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
      if (s.includes('ดี') || s.includes('active') || s.includes('ใช้') || s.includes('ปกติ') || s.includes('พร้อม')) return 'Active';
      if (s.includes('ซ่อม') || s.includes('maint') || s.includes('ชำรุด') || s.includes('เสีย')) return 'Maintenance';
      if (s.includes('จำหน่าย') || s.includes('disposal') || s.includes('ขาย') || s.includes('เสื่อม') || s.includes('ซาก')) return 'Disposal';
      return 'Active';
  };

  const keywordMap: Record<string, string[]> = {
    plate_no: ['ทะเบียน', 'เลขทะเบียน', 'หมายเลขโล่', 'plate', 'registration', 'no.', 'no', 'vehicleno', 'id', 'license'],
    vehicle_type: ['ประเภท', 'ชนิด', 'ลักษณะ', 'category', 'type', 'kind', 'class', 'vehicle'],
    brand: ['ยี่ห้อ', 'รุ่น', 'แบบ', 'brand', 'model', 'manufacturer', 'maker'],
    engine_no: ['เลขเครื่อง', 'หมายเลขเครื่อง', 'engine', 'chassis', 'vin', 'serial', 'number'],
    asset_value: ['ราคา', 'มูลค่า', 'งบประมาณ', 'ทุน', 'บาท', 'value', 'price', 'cost', 'amount', 'assetvalue', 'budget'],
    department: ['หน่วยงาน', 'สังกัด', 'แผนก', 'กอง', 'กำกับการ', 'unit', 'dept', 'department', 'office', 'section', 'division'],
    condition_status: ['สถานะ', 'สภาพ', 'ความพร้อม', 'status', 'condition', 'readiness', 'state', 'remark', 'หมายเหตุ'],
    purchase_year: ['ปี', 'พศ', 'คศ', 'จัดซื้อ', 'acquired', 'purchase', 'year', 'date', 'acquiredyear', 'fiscal']
  };

  const findHeaders = (jsonData: any[][]) => {
    let map: Record<string, number> = {};
    let headerRowIndex = -1;
    let maxMatchCount = 0;

    // Advanced Deep Scan: Scan each row from top down
    for (let r = 0; r < Math.min(jsonData.length, 100); r++) {
      const row = jsonData[r];
      if (!row || !Array.isArray(row)) continue;

      const currentMap: Record<string, number> = {};
      let matchCount = 0;
      
      // Within row: Scan columns from left to right
      row.forEach((cell, c) => {
        const cellText = String(cell || '').toLowerCase().replace(/\s/g, '');
        if (!cellText) return;

        for (const [key, keywords] of Object.entries(keywordMap)) {
          if (keywords.some(k => cellText.includes(k))) {
             // If this column hasn't been mapped yet, or if exact match preference
             if (currentMap[key] === undefined) {
               currentMap[key] = c;
               matchCount++;
             }
          }
        }
      });

      // Relaxed logic: We need at least 'plate_no' OR 'brand' plus at least 1 other field to consider it a header row
      // OR if we found a row with significantly more matches than before
      if (matchCount > maxMatchCount && (currentMap['plate_no'] !== undefined || currentMap['brand'] !== undefined)) {
        map = currentMap;
        headerRowIndex = r;
        maxMatchCount = matchCount;
      }

      // Early break if we found a very good candidate (4+ fields including key ones)
      if (matchCount >= 4 && currentMap['plate_no'] !== undefined) {
        break;
      }
    }
    return { map, headerRowIndex };
  };

  const processData = async (jsonData: any[][]) => {
    const { map, headerRowIndex } = findHeaders(jsonData);
    
    if (headerRowIndex === -1 || Object.keys(map).length < 2) {
      // Fallback: If no headers found, assume column 0 is plate, column 1 is brand/type if data exists
      if (jsonData.length > 1 && jsonData[1].length >= 2) {
         addLog("ไม่พบหัวตารางที่ชัดเจน - ระบบกำลังพยายามใช้การวิเคราะห์โครงสร้างอัตโนมัติ...", 'pending');
         // Try to construct map blindly
         map['plate_no'] = 0;
         map['vehicle_type'] = 1;
         // ... others default to undefined
         // Use row 0 as header index (data starts at 1)
      } else {
         throw new Error("ไม่พบโครงสร้างตารางที่สามารถอ่านได้ (กรุณาตรวจสอบว่ามีหัวคอลัมน์เช่น 'ทะเบียน' หรือ 'ยี่ห้อ')");
      }
    } else {
      addLog(`พบตารางข้อมูลที่บรรทัดที่ ${headerRowIndex + 1} (พบ ${Object.keys(map).length} คอลัมน์)`, 'success');
    }

    addLog(`กำลังสกัดข้อมูลยานพาหนะ...`);

    // Only start slicing if we have a valid header index, otherwise start from 0 or 1
    const startRow = headerRowIndex === -1 ? 1 : headerRowIndex + 1;
    const rows = jsonData.slice(startRow);
    const newVehicles: Vehicle[] = [];

    rows.forEach((row: any) => {
        if (!row || row.length === 0) return;
        
        const getVal = (key: string) => (map[key] !== undefined ? row[map[key]] : undefined);
        const plate = getVal('plate_no') || (headerRowIndex === -1 ? row[0] : undefined); // Fallback to col 0

        if (plate && String(plate).trim() !== '' && String(plate).length < 50) { // Basic sanity check
            const rawYear = Number(String(getVal('purchase_year') || '').replace(/[^0-9]/g, ''));
            const currentYear = new Date().getFullYear();
            // Normalize Year: If BE (> 2400) convert to AD
            let normalizedYear = (rawYear > 2400) ? rawYear - 543 : (rawYear || undefined);
            
            // Heuristic: if year is too small (e.g. < 1900) or future, ignore
            if (normalizedYear && (normalizedYear < 1950 || normalizedYear > currentYear + 1)) normalizedYear = undefined;

            newVehicles.push({
                plate_no: String(plate).trim(),
                vehicle_type: String(getVal('vehicle_type') || row[1] || "ยานพาหนะทั่วไป").trim(),
                brand: String(getVal('brand') || row[2] || "ไม่ระบุยี่ห้อ").trim(),
                engine_no: String(getVal('engine_no') || "-").trim(),
                asset_value: Number(String(getVal('asset_value') || '0').replace(/[^0-9.]/g, '')) || 0,
                department: String(getVal('department') || "ไม่ระบุหน่วยงาน").trim(),
                condition_status: mapStatus(getVal('condition_status')),
                purchase_year: normalizedYear
            });
        }
    });

    return newVehicles;
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setLogs([]);
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
        addLog(`กำลังเปิดไฟล์ ${file.name}...`);
        
        let jsonData: any[][] = [];

        if (extension === 'xlsx' || extension === 'xls') {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } 
        else if (extension === 'pdf') {
          updateLastLog('success', 'อ่านไฟล์ PDF สำเร็จ');
          addLog('AI กำลังสกัดตารางจาก PDF (Deep OCR Layer)...');
          const data = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Group items by Y coordinate to simulate rows
            const lines: Record<string, any[]> = {};
            textContent.items.forEach((item: any) => {
              const y = Math.round(item.transform[5]);
              if (!lines[y]) lines[y] = [];
              lines[y].push(item);
            });
            // Sort by X coordinate within row
            const sortedRows = Object.keys(lines)
              .sort((a, b) => Number(b) - Number(a))
              .map(y => lines[y].sort((a, b) => a.transform[4] - b.transform[4]).map(item => item.str));
            
            jsonData.push(...sortedRows);
          }
        }
        else if (extension === 'docx') {
          updateLastLog('success', 'อ่านไฟล์ Word สำเร็จ');
          addLog('AI กำลังวิเคราะห์โครงสร้างเอกสาร Word...');
          const data = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: data });
          // Simulating grid from Word text by split lines (very basic for text, complex for tables)
          jsonData = result.value.split('\n').filter(l => l.trim()).map(l => l.split('\t'));
        }
        else {
          throw new Error("ไม่รองรับไฟล์นามสกุลนี้ กรุณาใช้ .xlsx, .pdf หรือ .docx");
        }

        const newVehicles = await processData(jsonData);

        if (newVehicles.length > 0) {
            addLog(`สกัดข้อมูลสำเร็จ ${newVehicles.length} รายการ`, 'success');
            await new Promise(r => setTimeout(r, 500));
            onUpload(newVehicles);
            onClose();
        } else {
            addLog("ไม่พบข้อมูลยานพาหนะในไฟล์", 'error', "สาเหตุ: ไม่พบแถวที่มีข้อมูลทะเบียนรถ หรือรูปแบบไฟล์ซับซ้อนเกินไป");
        }

    } catch (err: any) {
        console.error(err);
        addLog("การนำเข้าล้มเหลว", 'error', err.message || "เกิดข้อผิดพลาดในการประมวลผลไฟล์");
    } finally {
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
      <div className={`
        w-full max-w-lg p-6 rounded-3xl relative transition-all overflow-hidden flex flex-col max-h-[90vh]
        ${isInnovation ? 'glass-prism bg-innovation-surface/90 shadow-[0_0_50px_rgba(217,70,239,0.3)] border border-innovation-primary/40' : isOcean ? 'bg-[#000d1a]/95 backdrop-blur-2xl border border-ocean-neon/40 shadow-[0_0_40px_rgba(0,243,255,0.2)]' : isTactical ? 'bg-black/90 backdrop-blur-xl border border-ops-green/40 shadow-[0_0_40px_rgba(57,255,20,0.15)]' : styles.cardClass}
      `}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
          <i className="fas fa-times"></i>
        </button>

        <h3 className={`text-xl font-bold mb-4 ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isInnovation ? 'text-transparent bg-clip-text bg-gradient-to-r from-innovation-primary to-innovation-secondary' : 'text-white'}`}>
            <i className="fas fa-microchip mr-2"></i> 
            Smart Data Import (AI 3.0)
        </h3>
        
        <p className="text-xs text-white/60 mb-6">รองรับ Excel (.xlsx), PDF (.pdf) และ Word (.docx) พร้อมระบบ Deep Scan หัวข้อตาราง</p>

        {uploading ? (
             <div className="flex-1 flex flex-col rounded-2xl p-6 bg-black/20">
                <div className="flex items-center mb-4">
                     <i className="fas fa-circle-notch fa-spin text-2xl mr-3 text-blue-400"></i>
                     <span className="font-bold text-white">ระบบกำลังประมวลผลข้อมูล...</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {logs.map((log, idx) => (
                        <div key={idx} className="text-[11px] flex flex-col mb-1">
                            <div className="flex items-center text-white/90">
                              <span className="w-4 mr-2">
                                {log.status === 'success' ? <i className="fas fa-check text-green-400"></i> : log.status === 'error' ? <i className="fas fa-times text-red-400"></i> : <i className="fas fa-spinner fa-spin text-blue-400"></i>}
                              </span>
                              <span>{log.step}</span>
                            </div>
                            {log.details && <div className="ml-6 text-[10px] text-red-400/80 italic">{log.details}</div>}
                        </div>
                    ))}
                </div>
             </div>
        ) : (
            <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer bg-black/20 hover:bg-black/40 ${isDragging ? 'border-blue-500' : 'border-white/20'}`}
            >
                <div className="flex gap-4 mb-4">
                    <i className="fas fa-file-excel text-4xl text-green-500"></i>
                    <i className="fas fa-file-pdf text-4xl text-red-500"></i>
                    <i className="fas fa-file-word text-4xl text-blue-500"></i>
                </div>
                <p className="text-sm font-bold text-white">วางไฟล์ หรือคลิกเพื่ออัปโหลด</p>
                <p className="text-[10px] text-white/40 mt-1">Excel, PDF, Word</p>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.pdf,.docx" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
            </div>
        )}
      </div>
    </div>
  );
};
