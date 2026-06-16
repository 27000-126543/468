import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import PlantDetail from './pages/PlantDetail';
import AlertCenter from './pages/AlertCenter';
import EmissionManagement from './pages/EmissionManagement';
import OperationReport from './pages/OperationReport';
import EquipmentManagement from './pages/EquipmentManagement';
import { AppContext } from './store/context';
import type { UserInfo } from './types';
import { MOCK_USER } from './mock/data';

const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo>(MOCK_USER);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: [theme.defaultAlgorithm],
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Card: {
            colorBorderSecondary: '#f0f2f5',
            borderRadiusLG: 12,
          },
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#001529',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
          },
        },
      }}
    >
      <AppContext.Provider value={{ user, setUser }}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="plant-detail/:plantId" element={<PlantDetail />} />
              <Route path="alert" element={<AlertCenter />} />
              <Route path="emission" element={<EmissionManagement />} />
              <Route path="report" element={<OperationReport />} />
              <Route path="equipment" element={<EquipmentManagement />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppContext.Provider>
    </ConfigProvider>
  );
};

export default App;
