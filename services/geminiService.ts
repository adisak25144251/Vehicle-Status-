import { GoogleGenAI } from "@google/genai";
import { Vehicle } from "../types";

const createClient = () => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY not set in environment.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateFleetInsight = async (vehicles: Vehicle[]): Promise<string> => {
    const client = createClient();
    if (!client) return "AI service unavailable: Missing API Key.";

    const total = vehicles.length;
    const maintenance = vehicles.filter(v => v.condition_status === 'Maintenance').length;
    const disposal = vehicles.filter(v => v.condition_status === 'Disposal').length;
    const totalValue = vehicles.reduce((sum, v) => sum + v.asset_value, 0);
    const byDept = vehicles.reduce((acc, v) => {
        acc[v.department] = (acc[v.department] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const prompt = `
        As a Border Patrol Police Logistics AI (AI ผู้ช่วยส่งกำลังบำรุง ตชด.), analyze this fleet snapshot:
        - Total Vehicles: ${total}
        - Vehicles in Maintenance: ${maintenance}
        - Vehicles for Disposal: ${disposal}
        - Total Asset Value: ${totalValue.toLocaleString()} THB
        - Breakdown by Dept: ${JSON.stringify(byDept)}
        
        Provide a concise executive summary in Thai language (max 3 sentences).
        Highlight any readiness risks (e.g. high maintenance ratio) and a brief budget recommendation for the Border Patrol Bureau.
        Tone: Official, authoritative, and strategic.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text || "No insights generated.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "System Error: Unable to retrieve AI insights.";
    }
};

export const chatWithFleetAI = async (message: string, contextVehicles: Vehicle[]): Promise<string> => {
    const client = createClient();
    if (!client) return "AI Chat Unavailable.";

    const systemInstruction = `
      คุณคือ "Advanced Fleet Intelligence & Governance Agent" ผู้เชี่ยวชาญการบริหารกองยานพาหนะภาครัฐ (ตชด.)
      - ตอบด้วยภาษาราชการที่สุภาพแต่เฉลียวฉลาด
      - เน้นความคุ้มค่าสูงสุด (3Es: Economy, Efficiency, Effectiveness)
      - ตรวจสอบความผิดปกติและจุดเสี่ยง
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3
            }
        });
        return response.text || "ขออภัยครับ ผมไม่สามารถประมวลผลคำสั่งนี้ได้ในขณะนี้";
    } catch (error) {
        return "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายความมั่นคง กรุณาลองใหม่ครับ";
    }
};

/**
 * World-Class Data Extraction & Analysis for Asset Registration
 */
export const analyzeAssetRegistration = async (vehicles: Vehicle[]): Promise<string> => {
    const client = createClient();
    if (!client) return "AI service unavailable.";

    const dataContext = JSON.stringify(vehicles);

    const prompt = `
บทบาท: คุณคือ “World-Class Data Extraction + AI/ML Architect + Thai Language Editor (Gov/Business Grade)”
ภารกิจ: รับไฟล์/ข้อความ (JSON ตาราง) แล้วสกัดข้อมูล → ทำความสะอาด → จัดหมวดหมู่ → สร้างตารางมาตรฐาน → ตรวจสอบความถูกต้อง/ความครบถ้วน → แก้ภาษาไทยอัตโนมัติ → ออกแบบแผน AI/ML ขั้นสูง พร้อมรายงานแบบมืออาชีพ

ข้อกำหนดเคร่งครัด (ห้ามละเมิด):
1) ห้ามเดา/ห้ามเติมข้อมูลเอง: ถ้าไม่มีหลักฐานในไฟล์ ต้องระบุว่า “ไม่พบข้อมูลในไฟล์” และใส่รายการคำถาม/ข้อมูลที่ต้องเพิ่ม
2) ทุกค่าที่สกัด (ตัวเลข/ชื่อ/วันที่/สถานะ) ต้องมีหลักฐานอ้างอิง (evidence)
3) แก้ภาษาไทยอัตโนมัติ: สะกด, เว้นวรรค, คำทับศัพท์, รูปแบบราชการ/ธุรกิจ ให้ถูกต้องและสม่ำเสมอ โดยห้ามเปลี่ยนความหมายเดิม
4) จัดหมวดหมู่ข้อมูลเป็น “Data Domains”: Master data, Transaction/Events, Finance/Budget, Status/Workflow, Documents/References

ข้อมูลอินพุตสำหรับประมวลผล:
${dataContext}

เอาต์พุตที่ต้องการ (ต้องส่งออกครบ 8 ส่วน):
1) normalized_tables (สรุปรายการตารางทั้งหมด)
2) tables (แสดงอย่างน้อย “ตัวอย่าง 10 แถวแรก” ต่อหนึ่งตารางสำคัญ)
3) evidence_map (ตัวอย่างหลักฐานอ้างอิงแบบเป็นระบบ)
4) data_dictionary (ชื่อคอลัมน์ไทย/อังกฤษ, type, unit, description)
5) data_quality_report + quality_score (0-100 พร้อมเหตุผล)
6) business_summary (ภาษาไทยทางการ อ่านง่าย)
7) ml_roadmap (แผนงาน AI/ML ระยะสั้น/กลาง/ยาว สำหรับข้อมูลชุดนี้)
8) learning_notes (สิ่งที่เรียนรู้จากไฟล์ชุดนี้ + ข้อเสนอแนะเพื่อทำรอบถัดไปให้แม่นขึ้น)

รูปแบบการส่งออก: ใช้ Markdown ที่อ่านง่ายและคัดลอกไปทำงานต่อได้ทันที
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                temperature: 0.2, // Low temperature for high extraction accuracy
            }
        });
        return response.text || "การวิเคราะห์ล้มเหลว: ไม่ได้รับข้อมูลจาก AI";
    } catch (error) {
        console.error("Asset Analysis Error:", error);
        return "เกิดข้อผิดพลาดในการประมวลผลข้อมูลทะเบียนรถอัจฉริยะ";
    }
};

/**
 * Advanced Fleet Governance & 3Es Analysis for Dashboard Visualization
 */
export const generateGovernanceAnalysis = async (vehicles: Vehicle[]): Promise<string> => {
    const client = createClient();
    if (!client) return "AI service unavailable.";

    const dataContext = JSON.stringify(vehicles);

    const prompt = `
คุณคือ "Chief Governance & Fleet Auditor (Expert level)"
ภารกิจ: วิเคราะห์ธรรมาภิบาลกองยานพาหนะ (ตชด.) ตามหลัก 3Es (Economy, Efficiency, Effectiveness)

ข้อมูลอินพุต (JSON):
${dataContext}

ความต้องการ:
1) วิเคราะห์ความคุ้มค่า (Value for Money) และประเมินต้นทุนรวม (TCO)
2) ตรวจสอบความผิดปกติหรือความเสี่ยงด้านธรรมาภิบาล
3) ให้ข้อเสนอแนะเชิงกลยุทธ์
4) สร้างโครงสร้าง JSON สำหรับทำ Dashboard (บรรจุใน Markdown Code Block แบบ json) ซึ่งประกอบด้วย metrics สำคัญ เช่น tco_estimate, efficiency_score, risk_level

เอาต์พุต:
- รายงานสรุปภาษาไทยแบบทางการ (Markdown)
- Dashboard Spec ในรูปแบบ JSON Code Block ( \`\`\`json ... \`\`\` )
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });
        return response.text || "การวิเคราะห์ธรรมาภิบาลล้มเหลว";
    } catch (error) {
        console.error("Governance Analysis Error:", error);
        return "เกิดข้อผิดพลาดในการวิเคราะห์ธรรมาภิบาล";
    }
};