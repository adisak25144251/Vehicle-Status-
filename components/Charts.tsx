import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { ThemeType } from '../types';

interface ChartProps {
  data: any[];
  theme: ThemeType;
  testId?: string;
}

const COLORS_TACTICAL = ['#39FF14', '#059669', '#10B981', '#064e3b'];
const COLORS_EXECUTIVE = ['#FFB000', '#D4AF37', '#8B4513', '#4d4d4d'];
const COLORS_COLORFUL = ['#ff0080', '#7928ca', '#0070f3', '#10B981'];
const COLORS_OFFICIAL = ['#2c5282', '#e53e3e', '#718096', '#cbd5e0'];
const COLORS_INNOVATION = ['#3B82F6', '#8B5CF6', '#10B981', '#0F172A'];
const COLORS_OCEAN = ['#00F3FF', '#00A8FF', '#00E8C6', '#004e7c'];

const getColors = (theme: ThemeType) => {
  switch (theme) {
    case ThemeType.TACTICAL: return COLORS_TACTICAL;
    case ThemeType.EXECUTIVE: return COLORS_EXECUTIVE;
    case ThemeType.INNOVATION: return COLORS_INNOVATION;
    case ThemeType.OCEAN: return COLORS_OCEAN;
    case ThemeType.OFFICIAL: return COLORS_COLORFUL;
    default: return COLORS_OFFICIAL;
  }
};

export const StatusDonutChart: React.FC<ChartProps> = ({ data, theme, testId }) => {
  const colors = getColors(theme);
  const isModern = theme === ThemeType.INNOVATION || theme === ThemeType.OCEAN || theme === ThemeType.TACTICAL || theme === ThemeType.EXECUTIVE || theme === ThemeType.OFFICIAL;
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  const isColorful = theme === ThemeType.OFFICIAL;
  
  return (
    <div data-testid={testId} style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isModern ? 45 : 40}
            outerRadius={isModern ? 65 : 60}
            paddingAngle={5}
            dataKey="value"
            cornerRadius={isModern ? 8 : 0}
            stroke={isOcean ? "rgba(0, 243, 255, 0.2)" : isTactical ? "rgba(57, 255, 20, 0.2)" : isExecutive ? "rgba(255, 176, 0, 0.2)" : isColorful ? "rgba(255, 255, 255, 0.1)" : "none"}
            animationBegin={0}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isModern 
                ? (isOcean ? 'rgba(0, 13, 26, 0.95)' : isTactical ? 'rgba(10, 10, 10, 0.95)' : isExecutive ? 'rgba(5, 5, 5, 0.95)' : isColorful ? 'rgba(10, 10, 15, 0.95)' : 'rgba(255,255,255,0.98)') 
                : '#1a202c', 
              border: isModern 
                ? (isOcean ? '1px solid #00F3FF' : isTactical ? '1px solid #39FF14' : isExecutive ? '1px solid #FFB000' : isColorful ? '1px solid #7928ca' : '1px solid #ddd') 
                : 'none', 
              borderRadius: '16px', 
              color: isOcean ? '#00F3FF' : isTactical ? '#39FF14' : isExecutive ? '#FFB000' : isColorful ? '#fff' : '#000',
              backdropFilter: isModern ? 'blur(16px)' : 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: 'inherit', fontWeight: 'bold', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ 
            paddingTop: '15px', 
            fontSize: '11px', 
            color: isOcean ? '#00F3FF' : isTactical ? '#39FF14' : isExecutive ? '#FFB000' : isColorful ? '#fff' : 'inherit',
            fontWeight: 'bold'
          }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DepartmentBarChart: React.FC<ChartProps> = ({ data, theme, testId }) => {
  const isOcean = theme === ThemeType.OCEAN;
  const isTactical = theme === ThemeType.TACTICAL;
  const isExecutive = theme === ThemeType.EXECUTIVE;
  const isColorful = theme === ThemeType.OFFICIAL;
  const isModern = isOcean || isTactical || isExecutive || isColorful || theme === ThemeType.INNOVATION;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const themeTickColor = isOcean ? '#00F3FF' : isTactical ? '#39FF14' : isExecutive ? '#FFB000' : isColorful ? '#fff' : '#4b5563';

  const STATUS_COLORS = {
    'ใช้การได้': isTactical ? '#39FF14' : isExecutive ? '#FFB000' : isOcean ? '#00F3FF' : isColorful ? '#0070f3' : '#10b981',
    'ชำรุด': isColorful ? '#facc15' : '#facc15',
    'รอจำหน่าย': isColorful ? '#ff0080' : '#ef4444'
  };

  return (
    <div 
      data-testid={testId} 
      style={{ width: '100%', height: 350 }}
      className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            opacity={isModern ? 0.2 : 0.1} 
            vertical={false}
            stroke={themeTickColor} 
          />
          <XAxis 
            dataKey="name" 
            type="category"
            tick={{ fill: themeTickColor, fontSize: 12, fontWeight: 'bold' }} 
            axisLine={false}
            tickLine={false}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis 
            type="number"
            tick={{ fill: themeTickColor, fontSize: 12, fontWeight: 'bold' }} 
            axisLine={false}
            tickLine={false}
            label={{ value: 'จำนวนรถ (คัน)', angle: -90, position: 'insideLeft', fill: themeTickColor, dy: 50, fontSize: 12, fontWeight: 'bold' }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{ 
              backgroundColor: isModern 
                ? (isOcean ? 'rgba(0, 13, 26, 0.95)' : isTactical ? 'rgba(10, 10, 10, 0.95)' : isExecutive ? 'rgba(5, 5, 5, 0.95)' : isColorful ? 'rgba(10, 10, 15, 0.95)' : 'rgba(255,255,255,0.98)') 
                : '#fff', 
              border: isModern 
                ? (isOcean ? '1px solid #00F3FF' : isTactical ? '1px solid #39FF14' : isExecutive ? '1px solid #FFB000' : isColorful ? '1px solid #7928ca' : '1px solid #ddd') 
                : '1px solid #ccc', 
              borderRadius: '16px',
              fontWeight: 'bold',
              color: 'inherit',
              backdropFilter: 'blur(10px)'
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px', fontWeight: 'bold', color: themeTickColor }} />
          <Bar dataKey="ใช้การได้" stackId="a" fill={STATUS_COLORS['ใช้การได้']} radius={[0, 0, 0, 0]} animationDuration={1500} barSize={40} />
          <Bar dataKey="ชำรุด" stackId="a" fill={STATUS_COLORS['ชำรุด']} radius={[0, 0, 0, 0]} animationDuration={1500} barSize={40} />
          <Bar dataKey="รอจำหน่าย" stackId="a" fill={STATUS_COLORS['รอจำหน่าย']} radius={[8, 8, 0, 0]} animationDuration={1500} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};