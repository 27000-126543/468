import { createContext, useContext } from 'react';
import type { UserInfo, WaterQuality, EquipmentStatus } from '../types';

export interface MonitorSnapshot {
  waterQualityMap: Record<string, WaterQuality>;
  equipmentMap: Record<string, EquipmentStatus>;
  snapshotTime: string;
}

interface AppContextType {
  user: UserInfo;
  setUser: (user: UserInfo) => void;
  monitorSnapshot: MonitorSnapshot;
  refreshMonitorSnapshot: () => void;
}

export const AppContext = createContext<AppContextType>({
  user: { role: 'national', name: '系统管理员' },
  setUser: () => {},
  monitorSnapshot: { waterQualityMap: {}, equipmentMap: {}, snapshotTime: '' },
  refreshMonitorSnapshot: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
