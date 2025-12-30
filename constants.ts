import { Vehicle, ThemeType } from './types';

export const MOCK_VEHICLES: Vehicle[] = [
  { plate_no: "1BK-9982", vehicle_type: "Pickup", brand: "Toyota", engine_no: "2GD-8821", asset_value: 850000, department: "Patrol Unit", condition_status: "Active", purchase_year: 2020 },
  { plate_no: "4GP-1123", vehicle_type: "Van", brand: "Toyota", engine_no: "1GD-4421", asset_value: 1200000, department: "Headquarters", condition_status: "Active", purchase_year: 2019 },
  { plate_no: "9XY-5541", vehicle_type: "Sedan", brand: "Honda", engine_no: "L15-9921", asset_value: 750000, department: "Investigation", condition_status: "Maintenance", purchase_year: 2018 },
  { plate_no: "2CL-3321", vehicle_type: "Pickup", brand: "Isuzu", engine_no: "RZ4-1122", asset_value: 820000, department: "Logistics", condition_status: "Active", purchase_year: 2021 },
  { plate_no: "5MM-0021", vehicle_type: "Motorcycle", brand: "Yamaha", engine_no: "G3B-1121", asset_value: 150000, department: "Patrol Unit", condition_status: "Active", purchase_year: 2022 },
  { plate_no: "3BK-1234", vehicle_type: "SUV", brand: "Ford", engine_no: "ECO-9911", asset_value: 1450000, department: "Special Ops", condition_status: "Active", purchase_year: 2020 },
  { plate_no: "1QA-5511", vehicle_type: "Sedan", brand: "Toyota", engine_no: "2ZR-3321", asset_value: 600000, department: "Headquarters", condition_status: "Disposal", purchase_year: 2015 },
  { plate_no: "7UY-8812", vehicle_type: "Truck", brand: "Hino", engine_no: "J08-1121", asset_value: 2500000, department: "Logistics", condition_status: "Active", purchase_year: 2019 },
  { plate_no: "2PL-9911", vehicle_type: "Pickup", brand: "Mitsubishi", engine_no: "4N1-2211", asset_value: 780000, department: "Patrol Unit", condition_status: "Maintenance", purchase_year: 2017 },
  { plate_no: "8KK-1122", vehicle_type: "Van", brand: "Nissan", engine_no: "YD2-3311", asset_value: 1100000, department: "Headquarters", condition_status: "Active", purchase_year: 2021 },
  { plate_no: "6JJ-4455", vehicle_type: "Motorcycle", brand: "Honda", engine_no: "CBR-1122", asset_value: 120000, department: "Patrol Unit", condition_status: "Active", purchase_year: 2023 },
  { plate_no: "4DD-6677", vehicle_type: "Sedan", brand: "Mercedes", engine_no: "M27-1122", asset_value: 3500000, department: "Executive", condition_status: "Active", purchase_year: 2022 },
  { plate_no: "9PO-3321", vehicle_type: "Pickup", brand: "Ford", engine_no: "PAN-1121", asset_value: 900000, department: "Special Ops", condition_status: "Maintenance", purchase_year: 2019 },
  { plate_no: "5LK-2211", vehicle_type: "SUV", brand: "Toyota", engine_no: "1GD-9988", asset_value: 1600000, department: "Executive", condition_status: "Active", purchase_year: 2021 },
  { plate_no: "1MN-7766", vehicle_type: "Truck", brand: "Isuzu", engine_no: "6HK-1122", asset_value: 2200000, department: "Logistics", condition_status: "Disposal", purchase_year: 2014 },
];

export const THEME_CONFIG = {
  [ThemeType.EXECUTIVE]: {
    name: "Premium Gold Neon",
    bgClass: "bg-[#050505]",
    textClass: "text-exec-gold drop-shadow-md",
    cardClass: "bg-exec-gold/10 backdrop-blur-md border border-exec-gold/40 shadow-[0_0_20px_rgba(255,176,0,0.15)] rounded-xl",
    primaryText: "text-exec-gold drop-shadow-[0_0:5px_rgba(255,176,0,0.8)]",
    secondaryText: "text-exec-gold/70",
    accentBorder: "border-exec-gold",
    font: "font-sans"
  },
  [ThemeType.OFFICIAL]: {
    name: "Government Official",
    bgClass: "bg-official-bg",
    textClass: "text-official-text",
    cardClass: "bg-official-card border border-official-border shadow-sm rounded-lg",
    primaryText: "text-official-primary",
    secondaryText: "text-official-secondary",
    accentBorder: "border-official-primary",
    font: "font-sans"
  },
  [ThemeType.TACTICAL]: {
    name: "Green Neon Glass",
    bgClass: "bg-[#020617]",
    textClass: "text-ops-green drop-shadow-md",
    cardClass: "bg-ops-green/5 backdrop-blur-xl border border-ops-green/30 shadow-[0_0_25px_rgba(57,255,20,0.1)] rounded-2xl",
    primaryText: "text-ops-green drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]",
    secondaryText: "text-ops-green/70",
    accentBorder: "border-ops-green",
    font: "font-sans"
  },
  [ThemeType.INNOVATION]: {
    name: "AI Innovation",
    bgClass: "bg-innovation-surface",
    textClass: "text-innovation-secondary",
    cardClass: "glass-prism rounded-3xl transition-all duration-300 hover:shadow-lg",
    primaryText: "text-innovation-primary",
    secondaryText: "text-innovation-secondary",
    accentBorder: "border-innovation-border",
    font: "font-sans"
  },
  [ThemeType.OCEAN]: {
    name: "Cyan Neon Glass",
    bgClass: "bg-[#000d1a]", 
    textClass: "text-ocean-neon drop-shadow-md",
    cardClass: "bg-ocean-neon/5 backdrop-blur-2xl border border-ocean-neon/30 shadow-[0_0_30px_rgba(0,243,255,0.1)] rounded-2xl",
    primaryText: "text-ocean-neon drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]",
    secondaryText: "text-ocean-neon/70",
    accentBorder: "border-ocean-neon",
    font: "font-sans"
  }
};