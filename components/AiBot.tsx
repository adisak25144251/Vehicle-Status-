
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
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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
    { label: 'เทคโนโลยี EV', query: 'ตอนนี้หน่วยงานตำรวจต่างประเทศเริ่มใช้รถไฟฟ้าแบบไหนบ้าง และมีความคุ้มค่าอย่างไรในระยะยาว?' },
    { label: 'ระเบียบจัดซื้อ', query: 'ตรวจสอบระเบียบการจัดซื้อจัดจ้างยานพาหนะภาครัฐปี 2567 มีประเด็นไหนที่ต้องระวังบ้าง?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className={`
          mb-4 w-[350px] md:w-[450px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up origin-bottom-right
          ${isInnovation ? 'glass-prism bg-innovation-surface/95 border-innovation-primary/30 shadow-[0_0_50px_rgba(217,70,239,0.2)]' : isOcean ? 'bg-[#000d1a]/95 backdrop-blur-2xl border border-ocean-neon/40 shadow-[0_0_30px_rgba(0,243,255,0.15)]' : isTactical ? 'bg-black/90 backdrop-blur-xl border border-ops-green/40 shadow-[0_0_30px_rgba(57,255,20,0.15)]' : isExecutive ? 'bg-[#050505]/95 backdrop-blur-xl border border-exec-gold/40 shadow-[0_0_30px_rgba(255,176,0,0.15)]' : styles.cardClass}
        `}>
          {/* Header */}
          <div className={`p-4 flex justify-between items-center shadow-lg relative z-20
            ${isInnovation ? 'bg-black/50 text-white border-b border-innovation-primary/30' : 
              isOcean ? 'bg-ocean-neon/10 text-ocean-neon border-b border-ocean-neon/30' : 
              isTactical ? 'bg-ops-green/10 text-ops-green border-b border-ops-green/30' : 
              isExecutive ? 'bg-exec-gold/10 text-exec-gold border-b border-exec-gold/30' : 
              'bg-gray-800 text-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOcean ? 'bg-ocean-neon text-black' : isTactical ? 'bg-ops-green text-black' : isExecutive ? 'bg-exec-gold text-black' : 'bg-white/20'}`}>
                <i className="fas fa-brain"></i>
              </div>
              <div>
                <span className="font-bold text-sm block leading-none mb-1">Fleet Intelligence</span>
                <span className="text-[10px] opacity-70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Online & Ready
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-opacity-20 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                <div className={`
                  max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed relative
                  ${msg.role === 'user' 
                    ? (isInnovation ? 'bg-gradient-to-r from-innovation-primary to-innovation-secondary text-white border border-white/20 rounded-br-sm shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 
                       isOcean ? 'bg-ocean-neon text-black font-bold border border-ocean-neon shadow-[0_0_10px_rgba(0,243,255,0.4)] rounded-br-sm' : 
                       isTactical ? 'bg-ops-green text-black font-bold border border-ops-green shadow-[0_0_10px_rgba(57,255,20,0.4)] rounded-br-sm' : 
                       isExecutive ? 'bg-exec-gold text-black font-bold border border-exec-gold rounded-br-sm' : 
                       'bg-blue-600 text-white rounded-br-sm') 
                    : (isInnovation ? 'bg-white/5 text-white border border-white/10 backdrop-blur-md rounded-bl-sm' : 
                       isOcean ? 'bg-ocean-neon/5 text-ocean-neon border border-ocean-neon/30 backdrop-blur-sm rounded-bl-sm' : 
                       isTactical ? 'bg-ops-green/5 text-ops-green border border-ops-green/30 backdrop-blur-sm rounded-bl-sm' : 
                       isExecutive ? 'bg-exec-gold/5 text-exec-gold border border-exec-gold/30 backdrop-blur-sm rounded-bl-sm' : 
                       'bg-gray-700 text-gray-200 rounded-bl-sm')}
                `}>
                  <div className="whitespace-pre-line prose prose-sm max-w-none prose-invert">
                    {msg.text}
                  </div>
                  
                  {/* Grounding Links Section */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-current/20 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1">
                        <i className="fas fa-link"></i> แหล่งข้อมูลอ้างอิง
                      </p>
                      {msg.links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-black/20 transition-colors group"
                        >
                          <i className="fas fa-external-link-alt text-[9px] opacity-50 group-hover:opacity-100"></i>
                          <span className="text-[10px] underline hover:no-underline truncate flex-1">{link.title || link.uri}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] opacity-40 mt-1 px-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className={`p-4 rounded-2xl rounded-bl-sm text-sm flex items-center gap-3 ${isInnovation ? 'bg-white/5 text-innovation-neon' : isOcean ? 'bg-ocean-neon/10' : isTactical ? 'bg-ops-green/10' : 'bg-gray-700'}`}>
                   <div className="flex space-x-1">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isInnovation ? 'bg-innovation-primary' : 'bg-current'}`} style={{ animationDelay: '0s' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isInnovation ? 'bg-innovation-secondary' : 'bg-current'}`} style={{ animationDelay: '0.2s' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isInnovation ? 'bg-innovation-neon' : 'bg-current'}`} style={{ animationDelay: '0.4s' }}></div>
                   </div>
                   <span className="text-[10px] font-bold opacity-70">กำลังค้นหาข้อมูล...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          {!loading && (
            <div className="px-4 py-3 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar border-t border-white/5 bg-black/20">
                {quickActions.map((action, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(action.query)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm
                            ${isInnovation ? 'border-innovation-primary/30 text-innovation-primary hover:bg-innovation-primary/20 hover:scale-105' :
                              isOcean ? 'border-ocean-neon/30 text-ocean-neon hover:bg-ocean-neon/20' : 
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
          <div className={`p-4 ${isInnovation ? 'bg-black/80' : 'bg-black/90'}`}>
            <div className="flex gap-3 items-center">
              <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์คำถามของคุณ..."
                disabled={loading}
                className={`flex-1 px-5 py-3 rounded-xl text-sm focus:outline-none transition-all
                  ${isInnovation ? 'bg-white/5 text-white border border-innovation-primary/30 placeholder-white/30 focus:bg-white/10 focus:border-innovation-secondary' : 
                    isOcean ? 'bg-ocean-neon/5 text-ocean-neon border border-ocean-neon/30 placeholder-ocean-neon/30 focus:bg-ocean-neon/10' : 
                    isTactical ? 'bg-ops-green/5 text-ops-green border border-ops-green/30 placeholder-ops-green/30 focus:bg-ops-green/10 shadow-inner' : 
                    isExecutive ? 'bg-exec-gold/5 text-exec-gold border border-exec-gold/30 placeholder-exec-gold/30 focus:bg-exec-gold/10 shadow-inner' : 
                    'bg-gray-800 text-white border border-gray-600'}
                `}
              />
              <button 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed
                  ${isInnovation ? 'bg-gradient-to-r from-innovation-primary to-innovation-secondary text-white hover:scale-105 shadow-innovation-primary/50' : 
                    isOcean ? 'bg-ocean-neon text-black hover:bg-white shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 
                    isTactical ? 'bg-ops-green text-black hover:bg-white shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 
                    isExecutive ? 'bg-exec-gold text-black hover:bg-white shadow-[0_0_15px_rgba(255,176,0,0.4)]' : 
                    'bg-green-600 text-white hover:bg-green-700'}
                `}
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative z-50
          ${isInnovation ? 'bg-gradient-to-br from-innovation-primary to-innovation-secondary text-white animate-bounce-slow shadow-[0_0_30px_rgba(217,70,239,0.5)]' : 
            isOcean ? 'bg-ocean-neon text-black animate-bounce-slow shadow-[0_0_20px_rgba(0,243,255,0.6)]' : 
            isTactical ? 'bg-ops-green text-black animate-bounce-slow shadow-[0_0_20px_rgba(57,255,20,0.6)]' : 
            isExecutive ? 'bg-exec-gold text-black animate-bounce-slow shadow-[0_0_20px_rgba(255,176,0,0.6)]' : 
            'bg-blue-600 text-white'}
        `}
      >
        <div className="relative">
             <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-2xl transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}></i>
             {!isOpen && <span className="absolute -top-2 -right-2 flex h-4 w-4">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTactical || isOcean ? 'bg-white' : 'bg-red-400'}`}></span>
               <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-black ${isTactical || isOcean ? 'bg-white' : 'bg-red-500'}`}></span>
             </span>}
        </div>
      </button>
    </div>
  );
};
