import { createContext, useContext } from 'react';
import type { UserInfo } from '../types';

interface AppContextType {
  user: UserInfo;
  setUser: (user: UserInfo) => void;
}

export const AppContext = createContext<AppContextType>({
  user: { role: 'national', name: '系统管理员' },
  setUser: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
