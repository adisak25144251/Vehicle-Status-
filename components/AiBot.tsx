
import React, { useState, useRef, useEffect } from 'react';
import { ThemeType, Vehicle, ChatMessage } from '../types';
import { chatWithFleetAI } from '../services/geminiService';
import { THEME_CONFIG } from '../constants';

interface AiBotProps {
  vehicles: Vehicle[];
  theme: ThemeType;
}

export const AiBot: React.FC<AiBotProps> = ({ vehicles, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'สวัสดีครับ ผมคือ Intelligence Fleet Agent ยินดีช่วยวิเคราะห์ธรรมาภิบาลและความคุ้มค่า พร้อมตรวจสอบข้อมูลออนไลน์แบบเรียลไทม์ให้ครับ', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const styles = THEME_CONFIG[theme];
  const isInnovation = theme === ThemeType.INNOVATION;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const result = await chatWithFleetAI(textToSend, vehicles);
    
    const botMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'model', 
      text: result.text, 
      links: result.links,
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const quickActions = [
    { label: 'ราคากลางรถมือสอง', query: 'ช่วยค้นหาราคากลางรถกระบะ Toyota ปี 2015-2020 ในตลาดปัจจุบันให้หน่อย เพื่อเปรียบเทียบความคุ้มค่าการซ่อม' },
    { label: 'เทคโนโลยี EV สีกากี', query: 'ตอนนี้หน่วยงานตำรวจต่างประเทศเริ่มใช้รถไฟฟ้าแบบไหนบ้าง และมีความคุ้มค่าอย่างไรในระยะยาว?' },
    { label: 'ระเบียบจัดซื้อล่าสุด', query: 'ตรวจสอบระเบียบการจัดซื้อจัดจ้างยานพาหนะภาครัฐปี 2567 มีประเด็นไหนที่ต้องระวังบ้าง?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className={`
          mb-4 w-[350px] md:w-[450px] h-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up
          ${isInnovation ? 'glass-prism bg-white/90' : isOcean ? 'bg-[#000d1a]/95 backdrop-blur-2xl border border-ocean-neon/40 shadow-[0_0_30px_rgba(0,243,255,0.15)]' : isTactical ? 'bg-black/90 backdrop-blur-xl border border-ops-green/40 shadow-[0_0_30px_rgba(57,255,20,0.15)]' : isExecutive ? 'bg-[#050505]/95 backdrop-blur-xl border border-exec-gold/40 shadow-[0_0_30px_rgba(255,176,0,0.15)]' : styles.cardClass}
        `}>
          {/* Header */}
          <div className={`p-4 flex justify-between items-center 
            ${isInnovation ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 
              isOcean ? 'bg-ocean-neon/10 text-ocean-neon border-b border-ocean-neon/30' : 
              isTactical ? 'bg-ops-green/10 text-ops-green border-b border-ops-green/30' : 
              isExecutive ? 'bg-exec-gold/10 text-exec-gold border-b border-exec-gold/30' : 
              'bg-gray-800 text-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOcean ? 'bg-ocean-neon text-black' : isTactical ? 'bg-ops-green text-black' : isExecutive ? 'bg-exec-gold text-black' : 'bg-white/20'}`}>
                <i className="fas fa-globe-americas"></i>
              </div>
              <div>
                <span className="font-bold text-sm block leading-none">Intelligence Fleet Agent</span>
                <span className="text-[10px] opacity-70">Grounding & Real-time Analytics</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-60 transition-opacity">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-opacity-20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? (isInnovation ? 'bg-blue-600 text-white rounded-br-none' : 
                       isOcean ? 'bg-ocean-neon text-black font-bold border border-ocean-neon shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 
                       isTactical ? 'bg-ops-green text-black font-bold border border-ops-green shadow-[0_0_10px_rgba(57,255,20,0.4)]' : 
                       isExecutive ? 'bg-exec-gold text-black font-bold border border-exec-gold' : 
                       'bg-blue-600 text-white') 
                    : (isInnovation ? 'bg-gray-100 text-gray-800 rounded-bl-none' : 
                       isOcean ? 'bg-ocean-neon/10 text-ocean-neon border border-ocean-neon/30 backdrop-blur-sm' : 
                       isTactical ? 'bg-ops-green/10 text-ops-green border border-ops-green/30 backdrop-blur-sm' : 
                       isExecutive ? 'bg-exec-gold/10 text-exec-gold border border-exec-gold/30 backdrop-blur-sm' : 
                       'bg-gray-700 text-gray-200')}
                `}>
                  <div className="whitespace-pre-line prose prose-sm max-w-none mb-2">
                    {msg.text}
                  </div>
                  
                  {/* Grounding Links Section */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-current/10 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                        <i className="fas fa-link mr-1"></i> แหล่งข้อมูลอ้างอิง:
                      </p>
                      {msg.links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-[10px] underline hover:opacity-70 transition-opacity truncate max-w-full"
                        >
                          {link.title || link.uri}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${isInnovation ? 'bg-gray-100' : isOcean ? 'bg-ocean-neon/10' : isTactical ? 'bg-ops-green/10' : 'bg-gray-700'}`}>
                  <div className="relative">
                    <i className={`fas fa-search fa-spin text-xs absolute -top-1 -right-1 ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : 'text-blue-400'}`}></i>
                    <i className={`fas fa-globe-asia text-xl ${isOcean ? 'text-ocean-neon' : isTactical ? 'text-ops-green' : isExecutive ? 'text-exec-gold' : 'text-blue-400'}`}></i>
                  </div>
                  <span className="opacity-60 italic text-[11px] font-bold">AI กำลังวิเคราะห์ข้อมูลเรียลไทม์...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          {!loading && messages.length < 15 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar border-t border-white/5 bg-black/5">
                {quickActions.map((action, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(action.query)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border
                            ${isOcean ? 'border-ocean-neon/30 text-ocean-neon hover:bg-ocean-neon/20' : 
                              isTactical ? 'border-ops-green/30 text-ops-green hover:bg-ops-green/20' : 
                              isExecutive ? 'border-exec-gold/30 text-exec-gold hover:bg-exec-gold/20' :
                              'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                        `}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t ${isInnovation ? 'border-gray-100' : isOcean ? 'border-ocean-neon/30 bg-black' : isTactical ? 'border-ops-green/30 bg-black' : isExecutive ? 'border-exec-gold/30 bg-black' : 'border-gray-700'}`}>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="ถามราคากลาง, ข่าวเทคโนโลยี หรือระเบียบ..."
                className={`flex-1 px-5 py-3 rounded-xl text-sm focus:outline-none transition-all
                  ${isInnovation ? 'bg-gray-100 text-gray-800 focus:ring-2 focus:ring-blue-400' : 
                    isOcean ? 'bg-ocean-neon/5 text-ocean-neon border border-ocean-neon/30 placeholder-ocean-neon/30 focus:bg-ocean-neon/10' : 
                    isTactical ? 'bg-ops-green/5 text-ops-green border border-ops-green/30 placeholder-ops-green/30 focus:bg-ops-green/10 shadow-inner' : 
                    isExecutive ? 'bg-exec-gold/5 text-exec-gold border border-exec-gold/30 placeholder-exec-gold/30 focus:bg-exec-gold/10 shadow-inner' : 
                    'bg-gray-800 text-white border border-gray-600'}
                `}
              />
              <button 
                onClick={() => handleSend()}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90
                  ${isInnovation ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                    isOcean ? 'bg-ocean-neon text-black hover:bg-white shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 
                    isTactical ? 'bg-ops-green text-black hover:bg-white shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 
                    isExecutive ? 'bg-exec-gold text-black hover:bg-white shadow-[0_0_15px_rgba(255,176,0,0.4)]' : 
                    'bg-green-600 text-white hover:bg-green-700'}
                `}
              >
                <i className="fas fa-search-location text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group
          ${isInnovation ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white animate-bounce-slow' : 
            isOcean ? 'bg-ocean-neon text-black animate-bounce-slow shadow-[0_0_20px_rgba(0,243,255,0.6)]' : 
            isTactical ? 'bg-ops-green text-black animate-bounce-slow shadow-[0_0_20px_rgba(57,255,20,0.6)]' : 
            isExecutive ? 'bg-exec-gold text-black animate-bounce-slow shadow-[0_0_20px_rgba(255,176,0,0.6)]' : 
            'bg-blue-600 text-white'}
        `}
      >
        <div className="relative">
             <i className={`fas ${isOpen ? 'fa-times' : 'fa-satellite-dish'} text-2xl transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}></i>
             {!isOpen && <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTactical || isOcean ? 'bg-white' : 'bg-red-400'}`}></span>
               <span className={`relative inline-flex rounded-full h-3 w-3 ${isTactical || isOcean ? 'bg-white' : 'bg-red-500'}`}></span>
             </span>}
        </div>
      </button>
    </div>
  );
};
