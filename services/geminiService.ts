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

    const total = contextVehicles.length;
    const active = contextVehicles.filter(v => v.condition_status === 'Active').length;
    const maintenance = contextVehicles.filter(v => v.condition_status === 'Maintenance').length;
    const dataContext = JSON.stringify(contextVehicles.slice(0, 20)); // Provide some actual data context

    const systemInstruction = `
      คุณคือ "Advanced Fleet Intelligence & Governance Agent" ผู้เชี่ยวชาญการบริหารกองยานพาหนะภาครัฐ (ตชด.)
      
      ภารกิจของคุณ:
      1) มุ่งเน้นความคุ้มค่าสูงสุด (Value for Money - 3Es: Economy, Efficiency, Effectiveness)
      2) สนับสนุนธรรมาภิบาลและความโปร่งใส (Good Governance)
      3) ตรวจสอบความผิดปกติและจุดเสี่ยง (Fraud/Anomaly Detection)
      4) วิเคราะห์ต้นทุนรวม (TCO/LCC) และจุดคุ้มทุนในการซ่อม vs จำหน่าย

      บริบทปัจจุบัน:
      - จำนวนรถทั้งหมดในระบบ: ${total} คัน
      - สถานะ: พร้อมใช้ ${active} คัน, ชำรุด/ซ่อม ${maintenance} คัน
      - ตัวอย่างข้อมูลบางส่วน: ${dataContext}

      แนวทางการตอบ:
      - ตอบด้วยภาษาราชการที่สุภาพแต่เฉลียวฉลาด (Professional & Insightful)
      - หากผู้ใช้ถามเรื่องความคุ้มค่า ให้ใช้หลัก 3Es หรือ TCO มาอธิบาย
      - หากพบความผิดปกติในคำถาม (เช่น รถเก่ามากแต่ยังซ่อมหนัก) ให้ชี้จุดเสี่ยงและเสนอมาตรการแก้ไข
      - ใช้ Markdown (Bold, Lists, Tables) เพื่อให้ข้อมูลอ่านง่าย
      - ห้ามเดาตัวเลขที่ไม่มีในบริบท ถ้าข้อมูลไม่พอให้ระบุว่าต้องการข้อมูลส่วนใดเพิ่ม (เช่น เลขไมล์, ประวัติซ่อม)
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3 // Consistency over creativity
            }
        });
        return response.text || "ขออภัยครับ ผมไม่สามารถประมวลผลคำสั่งนี้ได้ในขณะนี้";
    } catch (error) {
        return "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายความมั่นคง กรุณาลองใหม่ครับ";
    }
};

export const generateGovernanceAnalysis = async (vehicles: Vehicle[]): Promise<string> => {
    const client = createClient();
    if (!client) return "Error: API Key missing.";

    const dataContext = JSON.stringify(vehicles.map(v => ({
        ...v,
        age: new Date().getFullYear() - (v.purchase_year || 2020)
    })));

    const expertPrompt = `
    คุณคือ “Fleet Analytics & Governance Expert (ภาครัฐ)” ผู้เชี่ยวชาญการวิเคราะห์ข้อมูลเพื่อบริหารยานพาหนะทางราชการ
    
    เป้าหมาย:
    - สรุปสถานภาพกองยาน (Fleet Health)
    - ลดต้นทุนรวมตลอดอายุการใช้งาน (TCO/LCC) และเพิ่ม Value for Money (3Es)
    - สร้างระบบควบคุมภายใน + Audit Trail
    - ชี้จุดเสี่ยง (Risk/Fraud)

    Input Data (JSON):
    ${dataContext}

    งานที่ต้องทำ (Output Requirements):
    1. Data Understanding & Quality Report
    2. Fleet Overview & Utilization Analysis
    3. Cost & Value for Money (3Es Analysis)
    4. Maintenance & Reliability Strategy
    5. Risk / Anomaly / Compliance Check
    6. Optimization Recommendations

    รูปแบบการตอบ (Response Format):
    ส่วนที่ 1: รายงานภาษาไทยแบบผู้บริหาร (Markdown format)
    - ใช้หัวข้อชัดเจน Bullet points
    - สรุปตัวเลขสำคัญ (คำนวณจริงจาก Input Data เท่านั้น ห้ามมั่วตัวเลข)
    - ข้อเสนอแนะเชิงนโยบาย

    ส่วนที่ 2: dashboard_spec (JSON format)
    - สร้าง JSON Object สำหรับออกแบบ Dashboard ตามโครงสร้าง:
      {
        "pages": [...],
        "global_filters": [...],
        "metrics": [...],
        "charts": [...],
        "alerts": [...],
        "audit_log": [...]
      }
    - ต้องอยู่ใน Code Block \`\`\`json ... \`\`\` เท่านั้น

    วิเคราะห์ข้อมูลเดี๋ยวนี้ โดยเน้นความถูกต้องและธรรมาภิบาล
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: expertPrompt,
            config: {
                temperature: 0.2,
            }
        });
        return response.text || "Analysis failed.";
    } catch (error) {
        console.error("Governance Analysis Error:", error);
        return "System Error: Unable to perform governance analysis.";
    }
};