export interface PlantInfo {
  id: string;
  name: string;
  province: string;
  city: string;
  district: string;
  processType: string;
  designScale: number;
  currentLoad: number;
  lat: number;
  lng: number;
}

export interface WaterQuality {
  plantId: string;
  timestamp: string;
  codIn: number;
  codOut: number;
  codLimit: number;
  nh3nIn: number;
  nh3nOut: number;
  nh3nLimit: number;
  tpIn: number;
  tpOut: number;
  tpLimit: number;
  flowIn: number;
  flowOut: number;
}

export interface EquipmentStatus {
  plantId: string;
  totalEquipment: number;
  faultEquipment: number;
  faultRate: number;
  faultDetails: EquipmentFault[];
}

export interface EquipmentFault {
  equipmentId: string;
  equipmentName: string;
  faultType: string;
  faultTime: string;
  status: 'active' | 'repaired';
}

export interface EnergyConsumption {
  plantId: string;
  date: string;
  electricityKwh: number;
  costYuan: number;
  unitEnergyKwhPerTon: number;
  sludgeIntensity: number;
}

export interface AlertRecord {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water_quality' | 'equipment' | 'emission';
  level: 1 | 2 | 3;
  message: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'resolved';
  approvalFlow?: ApprovalStep[];
}

export interface ApprovalStep {
  role: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comment?: string;
}

export interface EmissionPlan {
  year: number;
  province: string;
  targetVolume: number;
  targetCod: number;
  targetNh3n: number;
  targetTp: number;
  actualVolume: number;
  actualCod: number;
  actualNh3n: number;
  actualTp: number;
}

export interface OperationReport {
  week: string;
  complianceRateYoy: number;
  complianceRateMom: number;
  energyRanking: { plantId: string; name: string; unitEnergy: number }[];
  faultDistribution: { type: string; count: number }[];
  recommendations: string[];
}

export type UserRole = 'national' | 'provincial' | 'municipal';

export interface UserInfo {
  role: UserRole;
  name: string;
  province?: string;
  city?: string;
}
