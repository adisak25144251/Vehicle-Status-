export interface Vehicle {
  plate_no: string;
  vehicle_type: string;
  brand: string;
  engine_no: string;
  asset_value: number;
  department: string;
  condition_status: 'Active' | 'Maintenance' | 'Disposal' | 'Unknown';
  purchase_year?: number;
}

export interface DashboardMetrics {
  totalCount: number;
  activeCount: number;
  maintenanceCount: number;
  disposalCount: number; // Added specific breakdown
  totalValue: number;
  utilizationRate: number;
}

export enum ThemeType {
  EXECUTIVE = 'EXECUTIVE',
  OFFICIAL = 'OFFICIAL',
  TACTICAL = 'TACTICAL',
  INNOVATION = 'INNOVATION',
  OCEAN = 'OCEAN'
}

export interface AiInsightResponse {
  summary: string;
  anomalies: string[];
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}